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
      kicker="Act 2"
      title="The invisible workforce is geographically concentrated."
      className="py-24"
    >
      <p>
        The missing workers are not randomly distributed across the country.
        Metro areas with larger coverage gaps are also the places where physical
        work is more concentrated by occupation and industry.
      </p>
      <p>
        Across 393 metropolitan areas, the correlation between the MSA coverage
        gap and the physical exposure proxy is{' '}
        <strong>{story.metrics.correlation.toFixed(3)}</strong>. That is a
        descriptive relationship, not a causal estimate, but it is strong enough
        to make geography part of the measurement problem rather than a
        secondary visualization.
      </p>

      <StatCallout
        label="Correlation between MSA coverage gaps and the physical exposure proxy. Excluding allocated MSA rows entirely gives 0.795."
        size="compact"
        value={story.metrics.correlation.toFixed(3)}
      />

      <DeferredChart loader={loadCountyMap} minHeight={560} />

      <FigureShell
        eyebrow="MSA relationship"
        title="Each dot is a metropolitan area, sized by total employment. The line is a simple least-squares fit."
      >
        <DeferredChart loader={loadMsaScatterPlot} minHeight={540} />
      </FigureShell>
    </Section>
  )
}

export default ActTwo
