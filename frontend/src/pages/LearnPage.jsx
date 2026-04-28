import { useState } from 'react'

const sections = [
  {
    title: 'The Basics',
    articles: [
      {
        id: 'what-is-broadband',
        title: 'What is Broadband?',
        body: `Broadband is a type of high-speed internet connection that is always on — meaning you don't need to dial in to connect like older internet connections required. The term "broadband" refers to the wide bandwidth of the connection, which allows large amounts of data to be transmitted at once.`,
        takeaway: 'Broadband is simply fast, always-on internet delivered to your home.'
      },
      {
        id: 'what-is-fibre',
        title: 'What is Fibre Optic Cable?',
        body: `Fibre optic cables transmit data as pulses of light through thin strands of glass or plastic, rather than electrical signals through copper wire. This makes them significantly faster and more reliable than older copper-based connections, and they are not affected by electrical interference or distance in the same way copper cables are.`,
        takeaway: 'Fibre uses light instead of electricity to send data, making it much faster and more reliable.'
      },
      {
        id: 'download-upload',
        title: 'Download vs Upload Speed',
        body: `Download speed refers to how fast data travels from the internet to your device — this affects how quickly pages load, how smoothly videos stream, and how fast files download. Upload speed refers to how fast data travels from your device to the internet — this matters for video calls, sending large files, and live streaming. Most households use far more download than upload bandwidth.`,
        takeaway: 'Download affects what you receive (streaming, browsing). Upload affects what you send (video calls, file sharing).'
      },
      {
        id: 'mbps',
        title: 'What is Mbps?',
        body: `Mbps stands for Megabits per second and is the standard unit used to measure internet speed. The higher the number, the faster the connection. To give you a sense of scale: streaming HD video typically requires around 5 Mbps, 4K streaming needs around 25 Mbps, and a 1,000 Mbps (1 Gbps) connection could download a full HD movie in just a few seconds. Note that Megabits (Mb) are different from Megabytes (MB) — there are 8 Megabits in 1 Megabyte.`,
        takeaway: 'Mbps measures your internet speed. More Mbps = faster internet. 100 Mbps is comfortable for most households.'
      },
      {
        id: 'latency',
        title: 'What is Latency?',
        body: `Latency (also called ping) is the time it takes for a signal to travel from your device to a server and back, measured in milliseconds (ms). Low latency means a faster, more responsive connection. High latency can cause delays even on fast connections. Latency matters most for online gaming and video calls, where delays are noticeable. Fibre connections typically have very low latency.`,
        takeaway: 'Latency is the delay in your connection. Lower is better. Under 20ms is excellent, under 50ms is good.'
      },
      {
        id: 'what-speed-do-i-need',
        title: 'What Speed Do I Actually Need?',
        body: `For a single person who browses the web, streams video and makes video calls, 100 Mbps is more than enough. For a household of 2–4 people using multiple devices simultaneously, 500 Mbps provides a comfortable experience with no congestion. For large households, heavy gamers, people who work from home with large file transfers, or anyone who wants future-proofing, 1 Gbps (1,000 Mbps) or above is worth considering. Remember that the speeds advertised are maximum speeds — real-world speeds can vary.`,
        takeaway: 'Most households are well served by 100–500 Mbps. You only need 1 Gbps+ if you have many heavy users.'
      },
    ]
  },
  {
    title: 'Connection Types',
    articles: [
      {
        id: 'fttp',
        title: 'FTTP — Full Fibre to the Premises',
        body: `FTTP (also called Full Fibre) means a fibre optic cable runs all the way from the exchange directly to your home or premises. This is the gold standard of broadband connections, delivering the fastest and most reliable speeds available. Because the entire connection is fibre, you get the full advertised speed regardless of how far you are from the exchange. Providers offering FTTP in Ireland include Eir, Virgin Media (in some areas), Sky and Vodafone.`,
        takeaway: `FTTP is the best type of connection available. If it's available in your area, it's worth choosing.`
      },
      {
        id: 'fttc',
        title: 'FTTC — Fibre to the Cabinet',
        body: `FTTC means fibre runs from the exchange to a green street cabinet near your home, but the final stretch to your door uses older copper telephone wire. This means speeds are affected by how far you are from the cabinet — the further away you are, the slower your connection. FTTC is sometimes marketed as "fibre broadband" but is not true full fibre. It typically delivers speeds of 30–80 Mbps.`,
        takeaway: `FTTC is part fibre, part copper. It's faster than old broadband but slower and less reliable than full fibre.`
      },
      {
        id: 'cable',
        title: 'Cable Broadband',
        body: `Cable broadband uses a hybrid fibre-coaxial (HFC) network — fibre to a local node, then coaxial cable (similar to TV cable) to your home. In Ireland, Virgin Media operates the main cable network. Cable can deliver very fast speeds and is generally reliable, though performance can dip during peak hours as bandwidth is shared with neighbours on the same local network segment.`,
        takeaway: 'Cable is fast and widely available in urban areas. Speeds can vary at busy times as the connection is shared locally.'
      },
      {
        id: '5g-home',
        title: '5G Home Broadband',
        body: `5G Home Broadband uses the same mobile 5G network as your smartphone to deliver internet to a router in your home — no physical cable required. It can offer speeds of 100–500 Mbps where 5G coverage is strong. However, speeds and reliability depend heavily on your proximity to a 5G mast and network congestion. It is a good option in areas where fixed line broadband is not available. Vodafone offers 5G Home Broadband in Ireland.`,
        takeaway: `5G Home Broadband is a cable-free option that is useful where fixed fibre is unavailable, but speeds can be inconsistent.`
      },
    ]
  },
  {
    title: 'Irish Broadband Infrastructure',
    articles: [
      {
        id: 'siro',
        title: 'SIRO',
        body: `SIRO is a joint venture between ESB and Vodafone that has built an open-access full fibre network across towns and cities in Ireland. Because it is open-access, multiple broadband providers can use the SIRO network to deliver their services — meaning you may be getting your broadband over SIRO infrastructure without realising it. SIRO has passed over 770,000 homes and businesses across more than 50 towns.`,
        takeaway: `SIRO is a shared fibre network built on ESB's infrastructure. Many providers use it to deliver full fibre broadband.`
      },
      {
        id: 'nbi',
        title: 'NBI — National Broadband Plan',
        body: `The National Broadband Plan (NBP) is a government initiative to bring high-speed broadband to rural and remote areas of Ireland that are not served by commercial providers. National Broadband Ireland (NBI) is the company responsible for building and operating this network. The NBP aims to connect approximately 560,000 premises in rural Ireland with speeds of at least 500 Mbps. Rollout is ongoing and coverage is expanding county by county.`,
        takeaway: `The NBI is bringing fast broadband to rural Ireland. If you're in a rural area, check if your address is in the NBI rollout area.`
      },
      {
        id: 'openeir',
        title: 'OpenEir',
        body: `OpenEir is the wholesale division of Eir that manages and provides access to Eir's existing telephone and broadband network infrastructure. Like SIRO, OpenEir operates as an open-access network, meaning other broadband providers can use Eir's physical network to deliver their services. This is why many smaller Irish providers can offer broadband without building their own infrastructure.`,
        takeaway: `OpenEir owns much of Ireland's existing broadband infrastructure and rents access to other providers.`
      },
    ]
  }
]

export default function LearnPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
        Learn About Broadband
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '48px', fontSize: '15px' }}>
        New to broadband? Not sure what all the jargon means? This guide explains
        everything you need to know in plain English.
      </p>

      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: '52px' }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#C4622D',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #E8E0D5'
          }}>
            {section.title}
          </h2>

          <div style={{ display: 'grid', gap: '8px' }}>
            {section.articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ArticleCard({ article }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      border: '1px solid #E8E0D5',
      borderRadius: '10px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          textAlign: 'left',
          color: '#2C2C2C'
        }}
      >
        {article.title}
        <span style={{
          fontSize: '20px',
          color: '#C4622D',
          fontWeight: '400',
          marginLeft: '12px',
          flexShrink: 0
        }}>
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <p style={{ color: '#5C5C5C', lineHeight: '1.75', marginBottom: '16px', fontSize: '14px' }}>
            {article.body}
          </p>
          <div style={{
            backgroundColor: '#FAF8F5',
            border: '1px solid #E8E0D5',
            borderLeft: '3px solid #C4622D',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0'
          }}>
            <span style={{ fontWeight: '600', color: '#C4622D', fontSize: '13px' }}>In plain English: </span>
            <span style={{ color: '#5C5C5C', fontSize: '13px' }}>{article.takeaway}</span>
          </div>
        </div>
      )}
    </div>
  )
}