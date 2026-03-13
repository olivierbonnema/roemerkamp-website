import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"

export function InMemoriamSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>In memoriam</SectionHeading>

        <div className="mt-10 grid md:grid-cols-[320px_1fr] gap-10 items-start max-w-4xl">
          <div className="flex-shrink-0">
            <Image
              src="/images/in-memoriam-jmk.jpg"
              alt="Jean Michel Kamp"
              width={320}
              height={400}
              className="w-80 h-auto grayscale"
            />
          </div>

          <div>
            <h3 className="text-xl font-serif font-normal text-gray-800 mb-4">
              Jean Michel Kamp (1969 – 2016)
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Op zondag 10 april 2016 werd een ski-ongeval onze collega en vriend Jean-Michel Kamp fataal. Van het ene op het andere moment was hij er niet meer. Hij liet een vrouw en zoontje achter. Jean-Michel was een zeer integere, energieke en bijzondere man.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We zullen die eeuwige lach van Jean-Michel koesteren en zijn gedachtegoed voortzetten.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
