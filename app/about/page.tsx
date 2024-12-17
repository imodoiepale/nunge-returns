import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">About Nunge Returns</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Simplifying tax compliance for Kenyan youth and students
          </p>
        </div>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              Nunge Returns is dedicated to making tax compliance easy and affordable for students and unemployed youth in Kenya. We believe that everyone should have access to simple, efficient tax filing solutions.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="text-lg text-muted-foreground">
              We envision a future where tax compliance is no longer a burden but a seamless part of every Kenyan's financial life. Through innovation and dedication, we're working to make this vision a reality.
            </p>
          </div>
        </div>
        {/* <div className="relative h-64 overflow-hidden rounded-lg md:h-80">
          <Image
            src="/placeholder.svg?height=400&width=800"
            alt="Nunge Returns Team"
            fill
            className="object-cover"
          />
        </div> */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Our Approach</h2>
          <p className="text-lg text-muted-foreground">
            At Nunge Returns, we combine cutting-edge technology with user-friendly design to create a tax filing experience that's both efficient and enjoyable. Our platform leverages automation and blockchain security to ensure accuracy and peace of mind for all our users.
          </p>
        </div>
      </div>
    </div>
  )
}

