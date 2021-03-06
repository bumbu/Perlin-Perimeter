/**************************
 Info messages
 **************************/
var $message = document.getElementById('message')

function showMessage(text) {
  if (text != null) {
    $message.innerHTML = text
  }
  $message.style.display = null
}

function hideMessage() {
  $message.style.display = 'none'
}

/**************************
 Config
 **************************/

var RenderConfigDefaults = {
  mode: 'pan'

, panX: 0
, panY: 0
, zoom: 1

, noiseOctaves: 8
, noiseFalloff: 0.4
, noiseSeed: 100
, noiseDetalisation: 0.03
, noiseRotation: 360
, noiseIntensity: 4.2

, pathInterval: 0.8
, pathPoints: 15
, pathPointDistance: 2
, pathStrokeWidth: 0.3

, updateOnEachChange: false
, originalArtVisible: false
, directionsVisible: true

, addFile: function() {
    $('#file-input').click()
  }
, name: 'demo.svg'
, export: function() {
    exportSVG()
  }
, resetToDefaults: function() {
    // Copy all setting from defaults
    for (var key in RenderConfigDefaults) {
      RenderConfig[key] = RenderConfigDefaults[key]
    }

    // Save to local storage
    saveConfig()

    // Update gui
    for (var i in gui.__controllers) {
      gui.__controllers[i].updateDisplay()
    }
    for (var folder in gui.__folders) {
      for (i in gui.__folders[folder].__controllers) {
        gui.__folders[folder].__controllers[i].updateDisplay()
      }
    }
    render()
  }
}

var RenderConfig = {}
for (var key in RenderConfigDefaults) {
  RenderConfig[key] = RenderConfigDefaults[key]
}

// Preload cached data
loadConfig()

function onConfigChange() {
  if (RenderConfig.updateOnEachChange) {
    render()
  }
}

function onFinishChange() {
  render()
  saveConfig()
}

function onZoomChange() {
  paper.view.zoom = RenderConfig.zoom
  saveConfig()
}

function onZoomChangeIntermediate() {
  if (RenderConfig.updateOnEachChange) {
    onZoomChange();
  }
}

var prevPanX = 0;
var prevPanY = 0;
function onPanChange() {
  var panXDiff = RenderConfig.panX - prevPanX;
  var panYDiff = RenderConfig.panY - prevPanY;
  paper.view.center = paper.view.center.add([panXDiff, panYDiff])
  prevPanX = RenderConfig.panX;
  prevPanY = RenderConfig.panY;
  saveConfig()
}

function onModeChange() {
  // hideMessage()
  switch (RenderConfig.mode) {
    case 'drawDirection':
      showMessage('Click and drag to create directions. Right click to remove a direction')
      break;
    case 'removeDirection':
      showMessage('Click on a direction to remove it')
      break;
    case 'pan':
      showMessage('Pan')
      break;
  }
}
onModeChange()

$('#file-input').on('change', function(ev) {
  var reader = new FileReader()
  reader.onloadend = function(ev) {
    paper.project.clear()
    paper.project.importSVG(ev.target.result)
    onImportDone()
  }

  reader.readAsText(this.files.item(0))
})

var gui = new dat.GUI()
gui.add(RenderConfig, 'mode', {
  'Draw directions': 'drawDirection'
, 'Remove directions': 'removeDirection'
, 'Pan': 'pan'
}).onFinishChange(function(){onModeChange();saveConfig();})

// Pan/Zoom
var f0 = gui.addFolder('Pan/Zoom');
var panXCtrl = f0.add(RenderConfig, 'panX').min(-1000).max(1000).step(1).onChange(onPanChange).onFinishChange(onPanChange)
var panYCtrl = f0.add(RenderConfig, 'panY').min(-1000).max(1000).step(1).onChange(onPanChange).onFinishChange(onPanChange)
f0.add(RenderConfig, 'zoom').min(0.01).max(5).step(0.01).onChange(onZoomChangeIntermediate).onFinishChange(onZoomChange)

// Noise
var f1 = gui.addFolder('Noise');
f1.add(RenderConfig, 'noiseOctaves').min(1).max(128).step(1).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.add(RenderConfig, 'noiseFalloff').min(0).max(1).step(0.01).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.add(RenderConfig, 'noiseSeed').min(0).max(65000).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.add(RenderConfig, 'noiseDetalisation').min(0).max(0.2).step(0.001).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.add(RenderConfig, 'noiseRotation').min(0).max(360).step(10).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.add(RenderConfig, 'noiseIntensity').min(0.1).max(10).step(0.1).onChange(onConfigChange).onFinishChange(onFinishChange)
f1.open()

// Path
var f2 = gui.addFolder('Paths');
f2.add(RenderConfig, 'pathInterval').min(0.1).max(10).step(0.1).onChange(onConfigChange).onFinishChange(onFinishChange)
f2.add(RenderConfig, 'pathPoints').min(0).max(1000).step(10).onChange(onConfigChange).onFinishChange(onFinishChange)
f2.add(RenderConfig, 'pathPointDistance').min(0.01).max(10).step(0.01).onChange(onConfigChange).onFinishChange(onFinishChange)
f2.add(RenderConfig, 'pathStrokeWidth').min(0.01).max(10).step(0.01).onChange(onConfigChange).onFinishChange(onFinishChange)
f2.open()

// Direction
var f4 = gui.addFolder('Options')
f4.add(RenderConfig, 'updateOnEachChange')
f4.add(RenderConfig, 'originalArtVisible').onFinishChange(function(){onOriginalArtVisibleChange();onFinishChange();})
f4.add(RenderConfig, 'directionsVisible').onFinishChange(function(){onDirectionVisibilityChange();onFinishChange();})
f4.open()

// Import/Export
var f3 = gui.addFolder('Import/Export');
f3.add(RenderConfig, 'addFile')
f3.add(RenderConfig, 'name')
f3.add(RenderConfig, 'export')
f3.add(RenderConfig, 'resetToDefaults')

/**************************
 Config save/load
 **************************/

function getStorableConfig() {
  var obj = {}
  for (var key in RenderConfig) {
    if (typeof RenderConfig[key] != 'function') {
      obj[key] = RenderConfig[key]
    }
  }

  return obj
}

function saveConfig() {
  if (window.localStorage) {
    localStorage.setItem('render-config', JSON.stringify(getStorableConfig()))
  }
}

function loadConfig() {
  if (window.localStorage && localStorage.hasOwnProperty('render-config')) {
    var StoredConfig = JSON.parse(localStorage['render-config'])
    for (var key in StoredConfig) {
      if (RenderConfig.hasOwnProperty(key)) {
        RenderConfig[key] = StoredConfig[key]
      }
    }
  }
}

/**************************
 Config
 **************************/

var processing = new Processing()
  , canvas = document.getElementById('paper-canvas')
  , pathsToFollow = []
  , originalLayer = null
  , drawLayer = null
  , isRendering = false
  , directionLayer = null

paper.setup(canvas);

paper.project.importSVG('images/letter.svg', function() {
  paper.view.draw();
  onImportDone()
  loadInitialDirections();
})

var $alert = document.getElementById('alert')
function onProcessingStart() {
  $alert.style.display = null
}

function onProcessingDone() {
  $alert.style.display = 'none'
}

function onImportDone() {
  onZoomChange()
  onPanChange()
  originalLayer = paper.project.activeLayer;
  var svgRectangleRemoved = false
  var svgChildren = paper.project.layers[0].children[0].removeChildren()
  // Remove first rectangle which is the border of SVG
  .filter(function(child) {
    if (!svgRectangleRemoved && child instanceof paper.Shape && child.type === 'rectangle') {
      svgRectangleRemoved = true
      return false
    }
    return true
  })

  svgChildren = unwrapGroups(svgChildren)
  // Transform shapes into paths
  .map(function(child) {
    if (child instanceof paper.Shape) {
      return child.toPath(false)
    } else {
      return child
    }
  })
  // Remove everything except paths
  .filter(function(child) {
    return child instanceof paper.Path
  })
  // Remove paths with less than 2 segments
  .filter(function(path) {
    return path.segments.length >= 2
  })

  // Remove SVG empty group
  paper.project.layers[0].removeChildren()

  // Add only useful children
  paper.project.layers[0].addChildren(svgChildren)

  // Alias
  pathsToFollow = paper.project.layers[0].children.slice()

  // Create a draw layer
  drawLayer = new paper.Layer()

  onOriginalArtVisibleChange()
  initDirectionLayer()
  render()
}

// Loads a predefined set of directions
function loadInitialDirections() {
  directionLayer.importJSON('["Layer",{"applyMatrix":true,"children":[["Path",{"applyMatrix":true,"segments":[[406,402.8],[397,426]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[317.7,339],[337,353]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[258.6,158.4],[232,133]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[258.6,402.8],[245,420]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[317.6,272.4],[333,256]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[317.6,209.3],[338,227]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[399.3705864158,243.7891458047],[376,243]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[363.2900444981,340.5465927063],[359,363]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[428.5537763405,337.6610160651],[453,339]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[470,402.8],[484,424]],"strokeColor":[1,0,0]}],["Path",{"applyMatrix":true,"segments":[[455.6808366368,377.6117775923],[478,383]],"strokeColor":[1,0,0]}]]}]');
}

function unwrapGroups(children) {
  var unwrapped = []
  children.map(function(child) {
    if (child instanceof paper.Group || child instanceof paper.CompoundPath) {
      unwrapped = unwrapped.concat(unwrapGroups(child.children))
    } else {
      unwrapped.push(child)
    }
  })

  return unwrapped
}

function onOriginalArtVisibleChange() {
  if (RenderConfig.originalArtVisible) {
    paper.project.insertLayer(0, originalLayer)
  } else {
    originalLayer.remove()
  }
}

/**************************
 Directions
 **************************/

function onDirectionVisibilityChange() {
  if (RenderConfig.directionsVisible) {
    paper.project.addLayer(directionLayer)
  } else {
    directionLayer.remove()
  }
}

function initDirectionLayer() {
  // Create direction layer
  directionLayer = new paper.Layer()
  // Init tool
  new paper.Tool()

  var lastPath = null
    , isPanning = false

  function startPath(ev) {
    directionLayer.activate()

    var minDistance = Infinity
      , from = null

    pathsToFollow.forEach(function(path) {
      if (ev.point.getDistance(path.getNearestPoint(ev.point)) < minDistance) {
        from = path.getNearestPoint(ev.point)
        minDistance = ev.point.getDistance(from)
      }
    })

    lastPath = paper.Path.Line(from, from)
    lastPath.strokeColor = 'red'
  }

  function removeDirection(ev) {
    // Find nearest path
    var minDistance = Infinity
      , direction = null

    directionLayer.children.forEach(function(path) {
      if (ev.point.getDistance(path.getNearestPoint(ev.point)) < minDistance) {
        direction = path
        minDistance = ev.point.getDistance(path.getNearestPoint(ev.point))
      }
    })

    nextClickWillRemoveADirection = false
    hideMessage()

    if (direction) {
      direction.remove()
      render()
    }
  }

  function isRightClick(ev) {
    if (ev.event.which) return ev.event.which === 3;
    if (ev.event.button) return ev.event.button === 2;
    return false;
  }

  paper.tool.onMouseDown = function(ev) {
    switch (RenderConfig.mode) {
      case 'drawDirection':
        if (isRightClick(ev)) {
          ev.preventDefault()
          removeDirection(ev)
        } else {
          startPath(ev)
        }
        break;
      case 'removeDirection':
        removeDirection(ev)
        break;
      case 'pan':
        isPanning = true
        break;
    }
  }

  paper.tool.onMouseMove = function(ev) {
    if (lastPath != null) {
      lastPath.lastSegment.point = ev.point
    }

    if (isPanning && ev.count % 2 == 1) {
      panXCtrl.setValue(panXCtrl.getValue() - ev.delta.x)
      panYCtrl.setValue(panYCtrl.getValue() - ev.delta.y)
    }

  }

  paper.tool.onMouseUp = function(ev) {
    if (lastPath != null) {
      lastPath.lastSegment.point = ev.point
      lastPath = null
      render()
    }

    isPanning = false
  }

  onDirectionVisibilityChange()
}

/**************************
 Rendering
 **************************/

function render() {
  if (drawLayer == null) {return false;}
  if (isRendering) {return false;}
  // Lock
  isRendering = true
  onProcessingStart()
  drawLayer.activate()

  // Set processing noise
  processing.noiseSeed(RenderConfig.noiseSeed)
  processing.noiseDetail(RenderConfig.noiseOctaves, RenderConfig.noiseFalloff)

  // Clear draw layer
  drawLayer.removeChildren()

  // Deffer rendering to have time for preparations
  setTimeout(function(){
    pathsToFollow.forEach(function(pathToFollow) {
      // Directional Vectors
      var directions = getSortedDirections(pathToFollow)
        , maxDirection = getMaxDirection(directions)
      // Other variables
        , perlinPath
        , lastPoint
        , vectorX
        , vectorY
        , normalPath
        , finalX
        , finalY

      for (var offset = 0; offset < pathToFollow.length; offset += RenderConfig.pathInterval) {
        perlinPath = new paper.Path()
        perlinPath.strokeColor = 'black';
        perlinPath.strokeWidth = RenderConfig.pathStrokeWidth;
        lastPoint = pathToFollow.getPointAt(offset)

        var noiseRotation = RenderConfig.noiseRotation || 360 // 0 == 360

        for (var step = 0; step < RenderConfig.pathPoints; step++) {
          perlinPath.add(lastPoint)

          vectorX = Math.cos(RenderConfig.noiseIntensity * processing.noise(lastPoint.x*RenderConfig.noiseDetalisation,lastPoint.y*RenderConfig.noiseDetalisation) + (noiseRotation / 180) * Math.PI)
          vectorY = -Math.sin(RenderConfig.noiseIntensity * processing.noise(lastPoint.x*RenderConfig.noiseDetalisation,lastPoint.y*RenderConfig.noiseDetalisation) + (noiseRotation / 180) * Math.PI)

          finalX = vectorX * RenderConfig.pathPointDistance
          finalY = vectorY * RenderConfig.pathPointDistance
          lastPoint = lastPoint.add([finalX, finalY])
        }

        var maxDirectionVector = new paper.Point(maxDirection)

        if (maxDirectionVector.length > 0) {
          var direction = getDirectionAtOffset(offset, directions, pathToFollow.length)
          var directionVector = new paper.Point(direction)
          var directionAngle = directionVector.angle
          // Compute path direction based on first and 4th point
          var pathStartPoint = perlinPath.getPointAt(0);
          var pathDirectionPoint = perlinPath.getPointAt(3 * perlinPath.length / RenderConfig.pathPoints);
          var pathDirection = pathDirectionPoint.subtract(pathStartPoint);
          var pathCurrentAngle = pathDirection.angle;
          var pathAngleDiff = (directionAngle - pathCurrentAngle);
          perlinPath.rotate(pathAngleDiff, pathStartPoint);

          // // Render direction
          // var dirEnd = (new paper.Point(pathStartPoint)).add(direction)
          // var dir = new paper.Path.Line(pathStartPoint, dirEnd)
          // dir.strokeColor = 'green';
          // dir.strokeWidth = 0.7;
        }

        // Simplify path
        perlinPath.simplify()
      }
    })

    // Unlock
    isRendering = false
    onProcessingDone()
    paper.view.update()
  // End set timeout
  }, 30)
}

/**************************
 Directions utils
 **************************/

function getSortedDirections(pathToFollow) {
  var sortedDirections = directionLayer.children.slice()
  .filter(function(path) {
    return pathToFollow.hitTest(path.firstSegment.point) != null
  })
  .map(function(path) {
    // Cache path offset from path to follow
    path.offset = pathToFollow.getOffsetOf(path.firstSegment.point)
    return path
  })
  .sort(function(path1, path2){
    return path1.offset - path2.offset
  })

  return sortedDirections
}

function getMaxDirection(directions) {
  var maxX = 0
    , maxY = 0

  directions.forEach(function(path) {
    maxX = Math.max(maxX, Math.abs(path.firstSegment.point.x - path.lastSegment.point.x))
    maxY = Math.max(maxY, Math.abs(path.firstSegment.point.y - path.lastSegment.point.y))
  })

  return [maxX, maxY]
}

paper.Path.prototype.getVector = function() {
  return [(this.lastSegment.point.x - this.firstSegment.point.x), (this.lastSegment.point.y - this.firstSegment.point.y)]
}

function getDirectionAtOffset(offset, directions, pathLength) {
  var fromDirection = null
    , toDirection = null
    , relativePosition = 0

  if (!directions || directions.length == 0) {
    return [0, 0]
  } else if (directions.length == 1) {
    return directions[0].getVector()
  } else {
    for (var i = 0; i < directions.length; i++) {
      if (directions[i].offset > offset) {
        toDirection = directions[i]

        if (i > 0) {
          fromDirection = directions[i - 1]
        } else {
          fromDirection = directions[directions.length - 1]
        }
        break;
      }
    }

    if (toDirection == null) {
      fromDirection = directions[directions.length - 1]
      toDirection = directions[0]
    }
  }

  if (toDirection.offset > fromDirection.offset) {
    relativePosition = (offset - fromDirection.offset) / (toDirection.offset - fromDirection.offset)
  } else {
    var directionsDistance = pathLength - fromDirection.offset + toDirection.offset

    if (offset >= fromDirection.offset) {
      relativePosition = (offset - fromDirection.offset) / directionsDistance
    } else {
      relativePosition = (offset - fromDirection.offset + pathLength) / directionsDistance
    }
  }

  var directionX = fromDirection.getVector()[0] * (1 - relativePosition) + toDirection.getVector()[0] * relativePosition
    , directionY = fromDirection.getVector()[1] * (1 - relativePosition) + toDirection.getVector()[1] * relativePosition

  return [directionX, directionY]
}

// Compute against maxDirection max
function directionRelativeToMax(direction, maxDirection) {
  var max = Math.max(maxDirection[0], maxDirection[1])
  return [direction[0] / max || 0, direction[1] / max || 0]
}

/**************************
 Export
 **************************/

function exportSVG() {
  alert('Exporting may take a while, please be patient!')
  var blob = new Blob([paper.project.exportSVG({asString: true})], {type: "text/plain;charset=utf-8"})
  saveAs(blob, RenderConfig.name)
}
