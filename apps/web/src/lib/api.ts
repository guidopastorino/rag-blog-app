const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
			...init?.headers,
		},
	});

	if (!res.ok) {
		const err = (await res.json().catch(() => ({}))) as { error?: string };
		throw new Error(err.error ?? `Request failed (${res.status})`);
	}

	return res.json() as Promise<T>;
}

export { API_URL };
