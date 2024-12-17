"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

const blogPosts = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: `Blog Post ${index + 1}`,
  date: `2023-0${(index % 12) + 1}-15`,
  excerpt: `This is the summary of Blog Post ${index + 1}. Learn key tips, insights, and guidance on tax filing...`,
  content: `This is the full content of Blog Post ${index + 1}. Here, you will find detailed insights, guidance, and tips to help you navigate tax compliance in Kenya.`,
  image: "/placeholder.svg?height=200&width=300"
}))

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState(null)

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter">Nunge Returns Blog</h1>
        <p className="text-xl text-muted-foreground">
          Stay updated with the latest news, tips, and insights about tax filing and compliance in Kenya.
        </p>

        {/* Layout changes based on selection */}
        <div className="grid grid-cols-4 gap-6">
          {/* Left column: Blogs */}
          <div
            className={`space-y-4 ${
              selectedPost ? "col-span-1" : "col-span-4 grid grid-cols-5 gap-6"
            } transition-all duration-300`}
          >
            {blogPosts.map((post, index) => (
              <article
                key={post.id}
                className={`group cursor-pointer rounded-lg border p-4 hover:bg-muted/50 ${
                  selectedPost ? "flex items-center space-x-4 p-2" : ""
                }`}
                onClick={() => setSelectedPost(post)}
              >
                {/* Index for compact view */}
                {selectedPost && (
                  <span className="text-xs font-bold text-muted-foreground">{index + 1}.</span>
                )}
                <div className={`${selectedPost ? "w-12 h-12" : "relative h-32"} relative`}>
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <div>
                  <h2
                    className={`${
                      selectedPost ? "text-sm font-medium" : "text-lg font-semibold"
                    } group-hover:text-primary`}
                  >
                    {post.title}
                  </h2>
                  {!selectedPost && (
                    <p className="mt-1 text-xs text-muted-foreground">Published on: {post.date}</p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Right column: Selected Post Preview */}
          {selectedPost && (
            <div className="col-span-3 sticky top-24 h-[calc(100vh-6rem)] overflow-auto rounded-lg border p-6">
              <h2 className="text-3xl font-bold mb-4">{selectedPost.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">Published on: {selectedPost.date}</p>
              <div className="relative h-48 w-full mb-4">
                <Image
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <p className="text-lg">{selectedPost.content}</p>
              <button
                className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                onClick={() => setSelectedPost(null)}
              >
                Back to All Blogs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

