import DeferredChart from '../components/DeferredChart'
import FigureShell from '../components/FigureShell'
import RoboticsFrontier from '../components/RoboticsFrontier'
import Section from '../components/Section'

const loadOccupationExplorer = () => import('../components/OccupationExplorer')

function ActThree() {
  return (
    <section className="py-24">
      <Section
        kicker="The frontier, occupation by occupation"
        title="The same ten jobs sit at different points on the actual robotics frontier."
      >
        <p>
          The Economic Index represents these workers with a single low score
          each. The physical systems being built around them do not. Some
          occupations already have paid, narrow automation for a specific task;
          others have only adjacent lab demonstrations or no credible humanoid
          path at all.
        </p>
        <p>
          For each occupation, the <em>specialized</em> track is the company
          with the strongest public evidence for a purpose-built system. The
          <em> humanoid</em> track is the strongest public evidence for a
          general-purpose human-form system, where one credibly exists. The
          comparison is deliberately task-level: a robot may cover trailer
          unloading, fry baskets, or hospital deliveries without covering the
          occupation itself.
        </p>
      </Section>
      <RoboticsFrontier />
      <Section
        className="pt-24"
        kicker="From evidence to measurement"
        title="The deployment evidence points back to a two-dimensional task model."
      >
        <p>
          The frontier rows above are not final exposure scores. They show why a
          physical AI extension should separate two mechanisms that are often
          collapsed in text-based measures: whether a system can clear every
          threshold needed for full task automation, and whether partial
          systems can still change the production function through cobots,
          teleoperation, inspection, routing, or exception handling.
        </p>
        <p>
          The prototype below returns to the original measurement frame, but
          changes the visual unit from abstract coordinates to workers at
          stake. It sizes each occupation by national employment, groups it by
          exposure pathway, then uses the detail panel to show the binding
          threshold behind the score.
        </p>

        <FigureShell
          eyebrow="Prototype occupation frame"
          title="Tile area is employment. Color is the exposure pathway. The detail panel shows the task threshold that keeps each score from becoming an occupation-level substitution claim."
          fullBleed
        >
          <DeferredChart loader={loadOccupationExplorer} minHeight={920} />
        </FigureShell>
      </Section>
    </section>
  )
}

export default ActThree
