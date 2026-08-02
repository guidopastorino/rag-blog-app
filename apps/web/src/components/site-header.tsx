"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SiteHeader() {
	const { data: session } = authClient.useSession();

	return (
		<header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
			<Link href="/" className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
				RAG Blog
			</Link>
			<nav className="flex items-center gap-3">
				<Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
					Posts
				</Link>
				{session?.user ? (
					<>
						<Link href="/posts/new">
							<Button size="sm">New post</Button>
						</Link>
						<span className="text-sm text-[var(--muted)]">
							{"username" in session.user
								? String(session.user.username ?? session.user.email)
								: session.user.email}
						</span>
						<Button size="sm" variant="outline" onClick={() => authClient.signOut()}>
							Log out
						</Button>
					</>
				) : (
					<>
						<Link href="/login">
							<Button size="sm" variant="outline">
								Log in
							</Button>
						</Link>
						<Link href="/register">
							<Button size="sm">Register</Button>
						</Link>
					</>
				)}
			</nav>
		</header>
	);
}
