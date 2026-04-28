import FigureShell from '../components/FigureShell'
import DeferredChart from '../components/DeferredChart'
import Section from '../components/Section'

const loadOccupationExplorer = () => import('../components/OccupationExplorer')

function ActThree() {
  return (
    <Section kicker="A different measurement frame" title="Physical AI exposure needs a different task model." className="py-24">
      <p>
        Knowledge-work exposure can often be treated as a continuous overlap
        between model capabilities and text-mediated tasks. Physical exposure
        has a different shape because many subtasks depend on threshold
        clearance: can the system perceive the scene, move safely, grasp the
        object, apply force, recover from variation, and satisfy liability
        constraints?
      </p>
      <p>
        The proposed extension separates two dimensions. The first is a
        full-automation threshold-clearance score: whether robotic systems can
        reliably perform the constituent physical subtasks end to end. The
        second is an augmentation pathway score: whether cobots, teleoperation,
        inspection, routing, documentation, or exception-handling systems can
        change the production function before full automation is feasible.
      </p>
      <p>
        The 20-occupation prototype is deliberately modest. It is a hand-scored
        demonstration of the coding frame, not a validated exposure estimate.
        A fellowship project would expand the task taxonomy, replace hand
        scores with reproducible ratings, and test whether the threshold model
        predicts adoption better than a single continuous exposure score.
      </p>

      <FigureShell
        eyebrow="Prototype occupation frame"
        title="Twenty occupations scored on full-automation threshold clearance and partial-augmentation pathways."
      >
        <DeferredChart loader={loadOccupationExplorer} minHeight={600} />
      </FigureShell>
    </Section>
  )
}

export default ActThree
