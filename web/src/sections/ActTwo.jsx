import DeferredChart from '../components/DeferredChart'
import FigureShell from '../components/FigureShell'
import Section from '../components/Section'
import StatCallout from '../components/StatCallout'
import { story } from '../data/story'

const loadCountyMap = () => import('../components/CountyMap')
const loadMsaScatterPlot = () => import('../components/MsaScatterPlot')

function ActTwo() {
  return (
    <Section
      kicker="Geography of non-Claude coverage"
      title="The non-prompters are geographically concentrated."
      className="py-24"
    >
      <p>
        Metro areas with larger coverage gaps also tend to be places where
        physical work is more concentrated by occupation and industry. The two
        patterns travel together; nothing here establishes that one produces
        the other.
      </p>
      <p>
        Across 393 metropolitan areas, the correlation between the metropolitan
        statistical area (MSA) coverage gap and the physical exposure proxy is{' '}
        <strong>{story.metrics.correlation.toFixed(3)}</strong>. That is not a
        causal estimate, but it is strong enough to make geography part of the
        measurement problem.
      </p>

      <StatCallout
        label="Correlation between coverage gap and the physical exposure proxy."
        size="compact"
        value={story.metrics.correlation.toFixed(3)}
      />

      <DeferredChart loader={loadCountyMap} minHeight={560} />

      <FigureShell
        eyebrow="Urban cores economic relationship"
        title="Each dot is a metropolitan area, sized by total employment. The line is a simple least-squares fit."
      >
        <DeferredChart loader={loadMsaScatterPlot} minHeight={540} />
      </FigureShell>
    </Section>
  )
}

export default ActTwo
