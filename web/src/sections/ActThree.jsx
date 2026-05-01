import DeferredChart from '../components/DeferredChart'
import FigureShell from '../components/FigureShell'
import RoboticsFrontier from '../components/RoboticsFrontier'
import Section from '../components/Section'

const loadOccupationExplorer = () => import('../components/OccupationExplorer')

function ActThree() {
  return (
    <section className="py-24">
      <Section
        kicker="Embodied AI frontier by occupation"
        title="The same ten jobs sit at different points on the robotics frontier."
      >
        <p>
          The Economic Index represents these workers with a single low score
          each. The physical systems being built around them do not. Some
          occupations already have paid, narrow automation for a specific task;
          others have only adjacent lab demonstrations or no credible path at
          all.
        </p>
        <p>
          For each occupation, the <em>specialized</em> track is the company
          with the strongest public evidence for a purpose-built system. The
          <em> humanoid</em> track is the strongest public evidence for a
          general-purpose human-form system. The comparison is deliberately
          task-level: a robot may cover trailer unloading, fry baskets, or
          hospital deliveries without covering the occupation itself.
        </p>
      </Section>
      <RoboticsFrontier />
      <Section
        className="pt-24"
        kicker="Measuring embodied AI"
        title="Robotic deployments point back to augmentation and automation."
      >
        <p>
          The table above shows why a physical AI extension should separate into
          two mechanisms: whether a system can clear every threshold needed for
          full task automation, and whether partial systems can still change the
          production function through copilots, teleoperation, or exception
          handling.
        </p>
        <p>
          The treemap below returns to the original measurement frame. It scores
          20 occupations on full-automation threshold clearance and augmentation
          pathway strength. The scores are hand-coded research scaffolding,
          meant to be replaced by a reproducible rubric in future work.
        </p>

        <FigureShell
          eyebrow="Occupation treemap"
          title="Tile area is employment. Color is the exposure pathway."
          fullBleed
        >
          <DeferredChart loader={loadOccupationExplorer} minHeight={920} />
        </FigureShell>
      </Section>
    </section>
  )
}

export default ActThree
