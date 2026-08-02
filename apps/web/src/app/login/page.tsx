"use client";

import { loginSchema } from "@rag-blog/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(formData: FormData) {
		setError(null);
		const parsed = loginSchema.safeParse({
			identifier: String(formData.get("identifier") ?? ""),
			password: String(formData.get("password") ?? ""),
		});
		if (!parsed.success) {
			setError("Invalid credentials format");
			return;
		}

		setPending(true);
		const identifier = parsed.data.identifier;
		const isEmail = identifier.includes("@");
		const result = isEmail
			? await authClient.signIn.email({
					email: identifier,
					password: parsed.data.password,
				})
			: await authClient.signIn.username({
					username: identifier,
					password: parsed.data.password,
				});
		setPending(false);

		if (result.error) {
			setError(result.error.message ?? "Login failed");
			return;
		}
		router.push("/");
		router.refresh();
	}

	return (
		<section className="mx-auto max-w-md space-y-6">
			<h1 className="font-[family-name:var(--font-fraunces)] text-3xl">Log in</h1>
			<form action={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="identifier">Email or username</Label>
					<Input id="identifier" name="identifier" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input id="password" name="password" type="password" required />
				</div>
				{error && <p className="text-sm text-red-700">{error}</p>}
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Signing in…" : "Sign in"}
				</Button>
			</form>
			<p className="text-sm text-[var(--muted)]">
				No account? <Link href="/register">Register</Link>
			</p>
		</section>
	);
}
