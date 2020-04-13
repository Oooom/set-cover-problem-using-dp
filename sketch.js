const TARGET_ICON_RADIUS = 3
var targets = []

const DEFAULT_AOI_RADIUS = 24

var sensors = []

var canvas_dom = null

function setup(){
    createCanvas(window.innerWidth, window.innerHeight)
    canvas_dom = document.getElementsByTagName('canvas')[0]
}

function draw(){
    clear()
    background(220, 220, 220)

    for(var sensor of sensors){
        sensor.render()
    }

    for(var target of targets){
        target.render()
    }
}

function addTarget(x,y){
    var id = (targets.length == 0) ? 1 : targets[targets.length - 1].id+1
    targets.push(new Target(x, y, id))
}
function removeTarget(id){
    targets.splice(targets.indexOf(targets.find((t) => t.id == id)), 1)
}

function addSensor(x,y, radii){
    var id = (sensors.length == 0) ? 1 : sensors[sensors.length - 1].id + 1
    sensors.push(new Sensor(x, y, radii, id))   
}

function removeSensor(id){
    sensors.splice(sensors.indexOf(sensors.find((s) => s.id == id)), 1)
}

function Target(x, y, id){
    this.x = x
    this.y = y
    this.id = id

    this.render = function(){
        noStroke()
        fill(0)
        circle(this.x, this.y, TARGET_ICON_RADIUS*2)
        textSize(10)
        text('T' + this.id, this.x + TARGET_ICON_RADIUS + 1, this.y + TARGET_ICON_RADIUS + 5)
    }
}

function Sensor(x, y, radius, id){
    this.x = x
    this.y = y
    this.aoi = new AreaOInfluence(x, y, radius)
    this.id = id

    this.render = function(){
        this.aoi.render()
        noStroke()
        fill(0)
        triangle(this.x, this.y - 6, this.x - 3, this.y + 6, this.x + 3, this.y + 6)
        textSize(10)
        text('S' + this.id, this.x + 5, this.y + 12)
    }
}

function AreaOInfluence(x, y, radii){
    this.x = x
    this.y = y
    this.radius = radii

    this.render = function () {
        stroke('rgba(255, 0, 255, 0.5)')
        fill('rgba(255, 0, 255, 0.1)')
        circle(this.x, this.y, this.radius * 2)
    }
}

function addTargetHandler(){
    showStatus("Click Anywhere to Place Target.")
    document.body.style.cursor = "crosshair"

    canvas_dom.addEventListener('click', acceptTargetLocationHandler)

    function acceptTargetLocationHandler(){
        addTarget(mouseX, mouseY)
        hideStatus()
        document.body.style.cursor = ""

        canvas_dom.removeEventListener('click', acceptTargetLocationHandler)
    }
}

function removeTargetHandler(){
    id = parseInt(prompt('ID of Target to be removed'))

    removeTarget(id)
}

function addSensorHandler(){
    showStatus("Click Anywhere to Place Sensor.")
    document.body.style.cursor = "crosshair"

    canvas_dom.addEventListener('click', acceptSensorLocationHandler)

    function acceptSensorLocationHandler(){
        addSensor(mouseX, mouseY, DEFAULT_AOI_RADIUS)

        canvas_dom.removeEventListener('click', acceptSensorLocationHandler)
        canvas_dom.addEventListener('click', acceptSensorRadiusHandler)
        canvas_dom.addEventListener('mousemove', changeAOIRadiusHandler)


        showStatus("Click again to set AOI OR Move Mouse to modify the AOI radius")
    }

    function changeAOIRadiusHandler(){
        var s = sensors[sensors.length - 1]
        var new_radius = Math.sqrt( (s.x - mouseX)**2 + (s.y - mouseY)**2 )

        if (new_radius < DEFAULT_AOI_RADIUS){
            new_radius = DEFAULT_AOI_RADIUS
        }

        s.aoi.radius = new_radius
    }

    function acceptSensorRadiusHandler(){
        canvas_dom.removeEventListener('click', acceptSensorRadiusHandler)
        canvas_dom.removeEventListener('mousemove', changeAOIRadiusHandler)
        hideStatus()
        document.body.style.cursor = ""
    }
}

function removeSensorHandler(){
    id = parseInt(prompt('ID of Sensor to be removed'))

    removeSensor(id)
}

//p5 takes it automatically, no need to register it
function keyPressed(){
    switch(key){
        case ' ':
            togglePane()
            break
        case 'a':
            addTargetHandler()
            break
        case 's':
            removeTargetHandler()
            break
        case 'z':
            addSensorHandler()
            break
        case 'x':
            removeSensorHandler()
            break
    }
}

