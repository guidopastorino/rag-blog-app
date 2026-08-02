"use client";

import { registerSchema } from "@rag-blog/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(formData: FormData) {
		setError(null);
		const parsed = registerSchema.safeParse({
			email: String(formData.get("email") ?? ""),
			username: String(formData.get("username") ?? ""),
			password: String(formData.get("password") ?? ""),
			name: String(formData.get("name") ?? "") || undefined,
		});
		if (!parsed.success) {
			setError("Check email, username (3+ chars), and password (8+ chars)");
			return;
		}

		setPending(true);
		const result = await authClient.signUp.email({
			email: parsed.data.email,
			password: parsed.data.password,
			name: parsed.data.name ?? parsed.data.username,
			username: parsed.data.username,
		});
		setPending(false);

		if (result.error) {
			setError(result.error.message ?? "Registration failed");
			return;
		}
		router.push("/");
		router.refresh();
	}

	return (
		<section className="mx-auto max-w-md space-y-6">
			<h1 className="font-[family-name:var(--font-fraunces)] text-3xl">Create account</h1>
			<form action={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">Display name</Label>
					<Input id="name" name="name" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="username">Username</Label>
					<Input id="username" name="username" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" name="email" type="email" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input id="password" name="password" type="password" required minLength={8} />
				</div>
				{error && <p className="text-sm text-red-700">{error}</p>}
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Creating…" : "Register"}
				</Button>
			</form>
			<p className="text-sm text-[var(--muted)]">
				Already have an account? <Link href="/login">Log in</Link>
			</p>
		</section>
	);
}
