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
    targets.splice(targets.indexOf(), 1)
}
function getTargetFromID(id){
    return targets.find((t) => t.id == id)
}

function addSensor(x,y, radii){
    var id = (sensors.length == 0) ? 1 : sensors[sensors.length - 1].id + 1
    sensors.push(new Sensor(x, y, radii, id))   
}

function removeSensor(id){
    sensors.splice(sensors.indexOf( getSensorFromID(id) ), 1)
}
function getSensorFromID(id){
    return sensors.find((s) => s.id == id)
}

function Target(x, y, id){
    this.x = x
    this.y = y
    this.id = id
    this.sensedBy = []

    this.refreshSensedBy = function(){
        var list = []

        for(var sensor of sensors){
            if(sensor.coversTarget(this)){
                list.push(sensor.id)
            }
        }

        this.sensedBy = list
    }

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

    this.coversTarget = function(target){
        return (Math.sqrt((this.x - target.x)**2 + (this.y - target.y)**2) <= this.aoi.radius)
    }

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
    this.colors = [255, 0, 255]
    var color_str = this.colors.join(',')

    this.setColor = function(r, g, b){
        this.colors[0] = r
        this.colors[1] = g
        this.colors[2] = b

        color_str = this.colors.join(',')
    }

    this.render = function () {
        stroke(`rgba(${color_str},0.5)`)
        fill(`rgba(${color_str},0.1)`)
        circle(this.x, this.y, this.radius * 2)
    }
}

function addTargetHandler(){
    var promise = new Promise(function(resolve, reject){
        showStatus("Click Anywhere to Place Target.")
        document.body.style.cursor = "crosshair"
    
        canvas_dom.addEventListener('click', acceptTargetLocationHandler)
    
        function acceptTargetLocationHandler(){
            addTarget(mouseX, mouseY)
            hideStatus()
            document.body.style.cursor = ""
    
            canvas_dom.removeEventListener('click', acceptTargetLocationHandler)

            resolve()
        }
    })

    return promise
}

function removeTargetHandler(){
    var promise = new Promise(function(resolve, reject){
        id = parseInt(prompt('ID of Target to be removed'))
    
        removeTarget(id)

        resolve()
    })

    return promise
}

function addSensorHandler(){
    var promise = new Promise(function(resolve, reject){

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

            resolve()
        }
    })

    return promise
}

function removeSensorHandler(){
    var promise = new Promise(function(resolve, reject){
        id = parseInt(prompt('ID of Sensor to be removed'))
    
        removeSensor(id)

        resolve()
    })

    return promise
}

//p5 takes it automatically, no need to register it
function keyPressed(){
    switch(key){
        case ' ':
            togglePane()

            break
        case 'a':
            addTargetHandler().then(function(){
                someChangeHappened()
            })

            break
        case 's':
            removeTargetHandler().then(function(){
                someChangeHappened()
            })

            break
        case 'z':
            addSensorHandler().then(function(){
                someChangeHappened()
            })

            break
        case 'x':
            removeSensorHandler().then(function(){
                someChangeHappened()
            })

            break
    }
}

function someChangeHappened(){
    for(var target of targets){
        target.refreshSensedBy()
    }
}

function colorSets(sets){
    //255, 0, 255 default color hai
    var setColors = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [0, 255, 255], [255, 255, 0], [125, 35, 255]]

    var i = 0
    for(var set of sets){
        var r = setColors[i][0]
        var g = setColors[i][1]
        var b = setColors[i][2]
        i++

        for(var sid of set){
            getSensorFromID(sid).aoi.setColor(r, g, b)
        }
    }
}

function calculate(){
    var targetCopy = []
    
    for(target of targets){
        targetCopy.push({
            id: target.id,
            sensedBy: JSON.parse(JSON.stringify(target.sensedBy)),
            sensed: false
        })
    }

    var sets = []
    
    while(true){
        targetCopy.sort(function(t1, t2){
            if(t1.sensedBy.length > t2.sensedBy.length) return 1
            if(t1.sensedBy.length < t2.sensedBy.length) return -1
            return 0
        })

        var set = getUniqueSetofSensors()
        
        if(set){
            sets.push(set)
            resetAndremoveSensorFromTargetSensedBy(set)
        }else{
            break
        }
    }

    return sets

    function getTargetCountUniquelySensedBy(sid){
        var cnt = 0
        for(var target of targetCopy){
            if(!target.sensed && target.sensedBy.indexOf(sid) != -1) cnt++
        }

        return cnt
    }
    function changeStateOfTargetSensedBy(sid){
        for (var target of targetCopy) {
            if (target.sensedBy.indexOf(sid) != -1){
                target.sensed = true
            }
        }
    }
    function resetAndremoveSensorFromTargetSensedBy(set){
        for(var target of targetCopy){
            target.sensed = false

            var i = 0
            while(target.sensedBy.indexOf(set[i]) != -1){
                target.sensedBy.splice(target.sensedBy.indexOf(set[i]), 1)
                i++
            }
        }
    }
    function getUniqueSetofSensors(){
        var set = []
        var covered_count = 0

        for (var target of targetCopy) {
            if (!target.sensed) {
                var max_uniquely_covered = -1
                var max_uniquely_covered_by_id = -1

                for (var sensorID of target.sensedBy) {
                    var uniquely_covered_by_this_sensor = getTargetCountUniquelySensedBy(sensorID)

                    if (max_uniquely_covered < uniquely_covered_by_this_sensor) {
                        max_uniquely_covered = uniquely_covered_by_this_sensor
                        max_uniquely_covered_by_id = sensorID
                    }
                }

                changeStateOfTargetSensedBy(max_uniquely_covered_by_id)
                set.push(max_uniquely_covered_by_id)
                covered_count += max_uniquely_covered
                if (max_uniquely_covered == targetCopy.length) {
                    break
                }
            }
        }

        return (covered_count == targetCopy.length) ? set : null
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
