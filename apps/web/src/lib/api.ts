/** Same-origin calls — Next proxies `/api/*` to the Worker so auth cookies stay on this host. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
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
