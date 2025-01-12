import Image from 'next/image'
import { PageBackground } from "@/components/ui/page-background"

export default function AboutPage() {
  return (
    <PageBackground>
      <div className="mx-auto max-w-3xl space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 animate-gradient">
            About Nunge Returns
          </h1>
          <p className="mt-2 text-sm text-cyan-700">
            Simplifying tax compliance for Kenyan youth and students
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="space-y-2 p-4 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-md hover:border-purple-300 transition-colors duration-300 shadow-lg hover:shadow-purple-100/50">
            <h2 className="text-lg font-bold text-purple-700">Our Mission</h2>
            <p className="text-sm text-gray-600">
              Nunge Returns is dedicated to making tax compliance easy and affordable for students and unemployed youth in Kenya. We believe that everyone should have access to simple, efficient tax filing solutions.
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border border-cyan-200 bg-white/50 backdrop-blur-md hover:border-cyan-300 transition-colors duration-300 shadow-lg hover:shadow-cyan-100/50">
            <h2 className="text-lg font-bold text-cyan-700">Our Vision</h2>
            <p className="text-sm text-gray-600">
              We envision a future where tax compliance is no longer a burden but a seamless part of every Kenyan's financial life. Through innovation and dedication, we're working to make this vision a reality.
            </p>
          </div>
        </div>

        <div className="space-y-2 p-4 rounded-lg border border-purple-200 bg-gradient-to-r from-white/80 to-white/80 backdrop-blur-md hover:border-purple-300 transition-colors duration-300 shadow-lg hover:shadow-purple-100/50">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
            Our Approach
          </h2>
          <p className="text-sm text-gray-600">
            At Nunge Returns, we combine cutting-edge technology with user-friendly design to create a tax filing experience that's both efficient and enjoyable. Our platform leverages automation and blockchain security to ensure accuracy and peace of mind for all our users.
          </p>
        </div>
      </div>
    </PageBackground>
  )
}
