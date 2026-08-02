import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
	variable: "--font-source-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "RAG Blog",
	description: "Blogs with likes, comments, and per-post AI Q&A",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={`${fraunces.variable} ${sourceSans.variable} antialiased`}>
				<Providers>
					<SiteHeader />
					<main className="mx-auto w-full max-w-5xl px-4 pb-16">{children}</main>
				</Providers>
			</body>
		</html>
	);
}
