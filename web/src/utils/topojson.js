function decodeArc(topology, arc) {
  const { transform } = topology
  let x = 0
  let y = 0

  return arc.map((point) => {
    x += point[0]
    y += point[1]
    if (!transform) return [x, y]
    return [
      x * transform.scale[0] + transform.translate[0],
      y * transform.scale[1] + transform.translate[1],
    ]
  })
}

function stitchRing(decodedArcs, ring) {
  const coordinates = []
  for (const arcIndex of ring) {
    const arc = arcIndex < 0
      ? [...decodedArcs[~arcIndex]].reverse()
      : decodedArcs[arcIndex]
    coordinates.push(...(coordinates.length ? arc.slice(1) : arc))
  }
  return coordinates
}

function convertGeometry(topology, decodedArcs, geometry) {
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.arcs.map((ring) => stitchRing(decodedArcs, ring)),
    }
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.arcs.map((polygon) =>
        polygon.map((ring) => stitchRing(decodedArcs, ring)),
      ),
    }
  }

  return null
}

export function topojsonFeatureCollection(topology, objectName) {
  const object = topology.objects[objectName]
  const decodedArcs = topology.arcs.map((arc) => decodeArc(topology, arc))

  return {
    type: 'FeatureCollection',
    features: object.geometries
      .map((geometry) => {
        const converted = convertGeometry(topology, decodedArcs, geometry)
        if (!converted) return null
        return {
          type: 'Feature',
          id: geometry.id,
          properties: geometry.properties ?? {},
          geometry: converted,
        }
      })
      .filter(Boolean),
  }
}
