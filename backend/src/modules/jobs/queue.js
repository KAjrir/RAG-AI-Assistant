export class DocumentQueue {
  static concurrent_jobs = 3;
  static active_jobs = 0

  constructor(items) {
    if (!!DocumentQueue.instance) {
        return DocumentQueue.instance;
    }
    DocumentQueue.instance = this;

    this.items = items;
    console.log(this.items)
    return this;
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }


}