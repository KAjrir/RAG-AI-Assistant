import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getAuth();
	}, []);

	async function getAuth() {
		try {
			const res = await api.get("/auth/me");
			setUser(res.data.user);
		} catch (err) {
			// 401 = gewoon niet ingelogd, geen echte fout
			if (err?.response?.status !== 401) console.error(err);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}

	// ── Auth ─────────────────────────────────

	async function register(name, email, password) {
		const res = await api.post("/auth/register", { name, email, password });
		if (res.data.success) await getAuth();
	}

	async function login(email, password) {
		const res = await api.post("/auth/login", { email, password });
		if (res.data.success) await getAuth();
	}

	async function logout() {
		try {
			await api.post("/auth/logout");
		} finally {
			// Ook als de call faalt: lokaal uitloggen
			setUser(null);
		}
	}

	// ── Workspace ────────────────────────────

	async function createOrg(data) {
		const res = await api.post("/users/create-org", data);
		if (res.data.success) await getAuth();
		return res.data;
	}

	async function checkSlug(slug) {
		const res = await api.get(`/users/check-slug?slug=${encodeURIComponent(slug)}`);
		return res.data.available;
	}

	// ── Profiel ──────────────────────────────

	async function uploadProfilePicture(file) {
		const formData = new FormData();
		formData.append("profile_picture", file);
		const res = await api.post("/users/profile-picture", formData);
		setUser((prev) => ({
			...prev,
			profile_picture_resource_url: res.data.url,
		}));
		return res.data.url;
	}

	async function deleteProfilePicture() {
		await api.delete("/users/profile-picture");
		setUser((prev) => ({ ...prev, profile_picture_resource_url: null }));
	}

	async function updateName(name) {
		await api.patch("/users/name", { name });
		setUser((prev) => ({ ...prev, name }));
	}

	// ── Uitnodigingen ────────────────────────

	async function fetchPendingInvites() {
		const res = await api.get("/invitations/user/pending");
		return res.data.invites ?? [];
	}

	async function validateInvite(token) {
		const res = await api.get(`/invitations/validate/${token}`);
		return res.data; // { valid, user_exists }
	}

	async function acceptInvite(token) {
		const res = await api.post("/invitations/accept", { token });
		if (!res.data.success) {
			throw new Error("Uitnodiging accepteren is mislukt.");
		}
		await getAuth(); // wachten, zodat memberships klaarstaan vóór navigate
		return res.data.workspace;
	}

	async function declineInvite(token) {
		await api.post("/invitations/decline", { token });
	}

	// ── Wachtwoord ───────────────────────────

	async function forgotPassword(email) {
		await api.post("/auth/forgot-password", { email });
	}

	// true als de token geldig is, false als hij ongeldig/verlopen is
	async function verifyResetToken(resetToken) {
		try {
			const res = await api.post("/auth/verify-reset-token", { resetToken });
			return !!res.data.success;
		} catch (err) {
			if (err?.response) return false; // server zegt nee (400/401/404)
			throw err; // netwerkfout e.d.
		}
	}

	async function resetPassword(resetToken, password) {
		await api.post("/auth/reset-password", { resetToken, password });
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				setUser,
				loading,
				login,
				register,
				logout,
				createOrg,
				checkSlug,
				fetchPendingInvites,
				validateInvite,
				acceptInvite,
				declineInvite,
				uploadProfilePicture,
				deleteProfilePicture,
				updateName,
				forgotPassword,
				verifyResetToken,
				resetPassword,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}