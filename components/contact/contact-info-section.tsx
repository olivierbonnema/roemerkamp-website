import { ContactForm } from "@/components/contact-form"

const team = [
  { name: "Jord Roemer", phone: "+31(0)6 11 87 48 93" },
  { name: "Marco Lange", phone: "+31(0)6 24 24 43 75" },
  { name: "Christian de Vries", phone: "+31(0)6 15 25 89 21" },
  { name: "Ernst Jansen", phone: "+31(0)6 50 73 42 94" },
  { name: "Thijs van der Kevie", phone: "+31(0)6 53 42 01 17" },
]

export function ContactInfoSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left — contact form */}
          <div>
            <ContactForm showInterestSelect={true} />
          </div>

          {/* Right — contact details */}
          <div className="space-y-8">
            <div>
              <p className="font-semibold text-[#1e3a5f]">Roemer Kamp &amp; Partners</p>
              <p className="text-gray-700">Wilhelminastraat 50</p>
              <p className="text-gray-700">2011 VN Haarlem</p>
              <p className="text-gray-700">Nederland</p>
            </div>

            <div className="space-y-1">
              <p className="text-gray-700">
                <span className="font-medium">Telefoon:</span>{" "}
                <a href="tel:0235173106" className="hover:text-[#311e86]">(023) 517 31 06</a>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">E-mail:</span>{" "}
                <a href="mailto:welkom@roemerkamp.nl" className="hover:text-[#311e86]">welkom@roemerkamp.nl</a>
              </p>
            </div>

            <div>
              <div className="w-12 h-1 bg-[#f75d20] mb-4" />
              <div className="space-y-3">
                {team.map((member) => (
                  <div key={member.name} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-gray-800 font-medium">{member.name}</span>
                    <span className="text-gray-600 text-sm">{member.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
