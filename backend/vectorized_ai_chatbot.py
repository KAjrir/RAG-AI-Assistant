import os
import json

from collections import defaultdict
from prompts import SYSTEM_PROMPT
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate


# === Setup ===
load_dotenv()

PERSIST_DIR = "./chroma_db"
EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-4o-mini"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Embeddings (alleen voor query)
embeddings = OpenAIEmbeddings(
    model=EMBED_MODEL,
    openai_api_key=OPENAI_API_KEY
)

# Load bestaande vectorstore
vectorstore = Chroma(
    collection_name="zoho_articles",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

streaming = True

# LLM
llm = ChatOpenAI(
    api_key=OPENAI_API_KEY,
    model=LLM_MODEL,
    temperature=1,
    streaming=streaming
)

chat_memory = defaultdict(list)

prompt = ChatPromptTemplate.from_messages([
("system", SYSTEM_PROMPT),
("assistant", "{chat_history}"),
("user", 
"""Knowledge Base Context:
{context}

Available Videos:
{videos}

Available Links:
{links}

Available Images:
{images}

User Question:
{question}

Follow the RESPONSE FORMAT strictly and render media properly."""
)
])

async def promptAI(question, session_id):
    # 1. Haal chat history op
    history = chat_memory[session_id]

    # 2. Retrieval (blijft hetzelfde)
    docs = retriever.invoke(question)
    print(len(docs))
    context = "\n\n".join([doc.page_content for doc in docs])

    all_videos = []
    all_links = []
    all_images = []

    for doc in docs:
        videos = json.loads(doc.metadata.get('videos', '[]'))
        all_videos.extend(videos)

        links = json.loads(doc.metadata.get("links", '[]'))
        all_links.extend(links)

        images = json.loads(doc.metadata.get("images", '[]'))
        all_images.extend(images)

    video_text = "\n".join([f"- {v}" for v in all_videos]) if all_videos else "Geen videos beschikbaar"
    link_text = "\n".join([f"- {l}" for l in all_links]) if all_links else "Geen links beschikbaar"
    image_text = "\n".join([f'- {i["url"]}' for i in all_images]) if all_images else "Geen fotos beschikbaar"

    # 3. Chain call MET history
    runnable = prompt | llm

    full_response = ""

    async for event in runnable.astream_events({
        "context": context,
        "question": question,
        "links": link_text,
        "videos": video_text,
        "images": image_text,
        "chat_history": history
    },
    version="v1"):
        print(event)
        if event["event"] == "on_chat_model_stream":
            token = event["data"]["chunk"].content
            full_response += token
            yield token

        if event["event"] == "on_chat_model_end":
            yield ""

    print(full_response)

    chat_memory[session_id].append(("user", question))
    chat_memory[session_id].append(("assistant", full_response))


if __name__ == "__main__":
    pass
