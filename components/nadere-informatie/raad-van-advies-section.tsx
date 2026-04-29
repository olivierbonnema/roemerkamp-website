import Image from "next/image"

const advisors = [
  {
    image: "/images/raad-jacques.jpg",
    name: "Jacques van Exter",
    year: "1947",
    text: "Jacques is de man die ons scherp houdt. Als voormalig chairman of the board van het Hoogovens pensionfonds heeft hij ook nog de ervaring om ons te adviseren. Met zijn analytisch vermogen weet hij altijd de juiste vragen te stellen. Hij verrijkt onze organisatie en bekijkt de zaken vanuit de cliënt. Daarnaast is Jacques gewoon een zeer aimabele persoon aan wie je graag advies vraagt. Wij zijn dan ook blij dat hij naast al zijn andere activiteiten, zijn ervaring en wijsheid met ons wil delen.",
  },
  {
    image: "/images/raad-martijn.jpg",
    name: "Martijn Baarda",
    year: "1964",
    text: "Martijn is een inspirator die als merkarchitect bij Growinski familiebedrijven adviseert op het gebied van lange termijn strategie en doelstellingen. Hij houdt ons bij de les als het aankomt op dit onderwerp en komt geregeld met voorstellen die de lange termijn toegevoegde waarde van onze organisatie versterken. Door zijn nieuwsgierigheid, heeft hij grote kennis opgebouwd op vele terreinen. Martijn is maatschappelijk zeer betrokken, of het nu gaat om sociale zaken, de natuur of andere culturen. Met zijn eindeloze ervaring geeft hij ons adviezen waarvan wij ons iedere keer afvragen, waarom konden wij dat zelf niet bedenken.",
  },
]

export function RaadVanAdviesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-10">
        <div className="w-12 h-1 bg-[#f75d20] rounded-sm mb-4" />
        <h2 className="font-serif text-[26px] md:text-[32px] font-normal text-[#1e3a5f] mb-10">
          Raad van Advies
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {advisors.map((advisor) => (
            <div key={advisor.name} className="border border-gray-100 bg-white overflow-hidden">
              <div className="relative w-full h-72 bg-gray-50">
                <Image
                  src={advisor.image}
                  alt={advisor.name}
                  fill
                  className="object-contain grayscale"
                />
              </div>
              <div className="p-6">
                <p className="font-serif text-lg text-[#1e3a5f] font-normal mb-0.5">{advisor.name}</p>
                <p className="text-xs text-gray-400 font-sans mb-4">{advisor.year}</p>
                <p className="text-gray-600 text-sm leading-relaxed font-sans">{advisor.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
