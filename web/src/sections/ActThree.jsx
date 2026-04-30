import RoboticsFrontier from '../components/RoboticsFrontier'
import Section from '../components/Section'

function ActThree() {
  return (
    <section className="py-24">
      <Section
        kicker="The frontier, occupation by occupation"
        title="The same ten jobs sit at radically different points on the actual robotics frontier."
      >
        <p>
          The Economic Index represents these workers with a single low score
          each. The robots being built for them do not. The ten deployment
          realities below — from Aurora&apos;s commercial driverless trucks in
          Texas to nursing-assistant tasks no humanoid has touched — get
          flattened into one number when the only signal is chat usage.
        </p>
        <p>
          For each occupation, the <em>specialized</em> track is the company
          currently doing the most paid commercial work on those tasks with a
          purpose-built system. The <em>humanoid</em> track is the leading
          effort to do the same work with a general-purpose human-form robot,
          where one credibly exists. Stages reflect verifiable deployment
          status, not roadmap claims.
        </p>
      </Section>
      <RoboticsFrontier />
    </section>
  )
}

export default ActThree
