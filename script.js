var myNextMuni = {};
myNextMuni.stops = []; // load from JSON file
myNextMuni.db = {};
// TODO sort stops

function Stop(routeTag, directionName, directionTitle, stopTag, stopName) {
    this.routeTag = routeTag;
    this.directionName = directionName;
    this.directionTitle = directionTitle;
    this.stopTag = stopTag;
    this.stopName = stopName;
}

Stop.prototype.getPredictions = function(li, callback) {
    var thisStop = this;
    $.ajax({
        url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&r=' + this.routeTag + '&s=' + this.stopTag,
        dataType: 'xml',
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
            myNextMuni.error();
        },
        success: function(xml) {
            thisStop._parsePredictions(li, xml);
            if (typeof(callback) == 'function') callback();
        }
    });
}

Stop.prototype._parsePredictions = function(li, xml) { // TODO use callback
    var predictions = [];
    $(xml).find('prediction').each(function() {
        var m = $(this).attr('minutes');
        if ($(this).attr('affectedByLayover') == 'true') {
            m += '*';
        }
        predictions.push(m);
    });
    predictions.sort(function(m1, m2) {
        return parseInt(m1) - parseInt(m2);
    });
    var container = li.find('[data-role=predictions]');
    container.empty();
    predictions.forEach(function(prediction) {
        var span = $(document.createElement('span'));
        span.text(prediction);
        container.append(span);
    });
    // TODO what if no predictions? (e.g. 10 at night)
}

myNextMuni.init = function() {
    var stops = myNextMuni.db.getStops();
    stops.forEach(function(stopObj) {
        var stop = new Stop(stopObj.routeTag,
            stopObj.directionName,
            stopObj.directionTitle,
            stopObj.stopTag,
            stopObj.stopName);
        myNextMuni.addStop(stop);
    });
}

myNextMuni.initData = function(jsonData) {
    myNextMuni.stops = jsonData;

    var routeSelect = $('#new-stop-form select[name=route]');
    var directionSelect = $('#new-stop-form select[name=direction]');
    var stopSelect = $('#new-stop-form select[name=stop]');
    var newStopButton = $('#new-stop-button');
    // load routes
    myNextMuni.stops.forEach(function(stop) {
        var option = $(document.createElement('option'));
        option.val(stop.tag);
        option.text(stop.title);
        routeSelect.append(option);
    });

    // load directions
    routeSelect.change(function() {
        myNextMuni.clearSelect(directionSelect);
        myNextMuni.clearSelect(stopSelect);
        stopSelect.attr('disabled', 'disabled');
        newStopButton.attr('disabled', 'disabled');

        var routeTag = myNextMuni.getSelectValue(routeSelect);
        var route = myNextMuni.getRoute(routeTag);
        route.directions.forEach(function(direction) {
            var option = $(document.createElement('option'));
            option.val(direction.name);
            option.text(direction.title);
            directionSelect.append(option);
        });
        directionSelect.removeAttr('disabled');
    });

    // load stops
    directionSelect.change(function() {
        myNextMuni.clearSelect(stopSelect);
        newStopButton.attr('disabled', 'disabled');

        var routeTag = myNextMuni.getSelectValue(routeSelect);
        var directionName = myNextMuni.getSelectValue(directionSelect);
        var stops = myNextMuni.getStops(routeTag, directionName);
        stops.forEach(function(stop) {
            var option = $(document.createElement('option'));
            option.val(stop.tag);
            option.text(stop.title);
            stopSelect.append(option);
        });
        stopSelect.removeAttr('disabled');
    });

    stopSelect.change(function() {
        newStopButton.removeAttr('disabled');
    });

    // add new stop
    newStopButton.click(function() {
        var routeTag = myNextMuni.getSelectValue(routeSelect);
        var directionName = myNextMuni.getSelectValue(directionSelect);
        var directionTitle = myNextMuni.getSelectText(directionSelect);
        var stopTag = myNextMuni.getSelectValue(stopSelect);
        var stopName = myNextMuni.getSelectText(stopSelect);
        var stop = new Stop(routeTag, directionName, directionTitle, stopTag, stopName);
        myNextMuni.db.addStop(stop);
        myNextMuni.addStop(stop);
    });

    $('#loading').hide();
}

myNextMuni.addStop = function(stop) {
    var li = $('#stop-li-template').clone();
    li.removeClass('template');
    li.removeAttr('id');
    li.attr('data-route-tag', stop.routeTag);
    li.attr('data-direction-name', stop.directionName);
    li.attr('data-direction-title', stop.directionTitle);
    li.attr('data-stop-tag', stop.stopTag);
    li.attr('data-stop-name', stop.stopName);
    var title = stop.routeTag + ' (' + stop.directionName + '): ' + stop.stopName;
    li.find('[data-role=title]').text(title);
    stop.getPredictions(li);
    $('#predictions').append(li);
}

myNextMuni.refresh = function(callback) {
    var lis = $('#predictions li:not(.template)');
    var numLisLeft = lis.length;
    if (numLisLeft == 0) {
        if (typeof(callback) == 'function') callback();
    }
    lis.each(function() {
        var li = $(this);
        var stop = new Stop(li.attr('data-route-tag'),
            li.attr('data-direction-name'),
            li.attr('data-direction-title'),
            li.attr('data-stop-tag'),
            li.attr('data-stop-name')); // TODO set data-stop-name
        stop.getPredictions(li, function() {
            numLisLeft--;
            if (numLisLeft == 0 && typeof(callback) == 'function') callback();
        });
    });
}

myNextMuni.clearSelect = function(select) {
    select.find('option:not(:disabled)').remove();
    select.find('option:first-of-type').attr('selected', 'selected');
}

myNextMuni.getSelectValue = function(select) {
    return select.find('option:selected').val();
}

myNextMuni.getSelectText = function(select) {
    return select.find('option:selected').text();
}

myNextMuni.getRoute = function(tag) { // TODO more efficient
    var stop = null;
    myNextMuni.stops.some(function(s) {
        if (s.tag == tag) {
            stop = s;
            return true;
        }
        return false;
    });
    return stop;
}

myNextMuni.getStops = function(routeTag, directionName) {
    var route = myNextMuni.getRoute(routeTag);
    var direction;
    route.directions.some(function(d) {
        if (d.name == directionName) {
            direction = d;
            return true;
        }
        return false;
    });
    if (direction) return direction.stops;
}

myNextMuni.toggleEdit = function() {
    $('.delete-button').toggle();
}

myNextMuni.deleteButton = function(event) {
    var stop = $(event.target).closest('.stop');
    var stops = $('#predictions li.stop:not(.template)');
    var index = stops.index(stop);
    if (index < 0) {
        myNextMuni.error();
    }
    myNextMuni.db.deleteStop(index);
    stop.remove();    
}

myNextMuni.error = function() {
    // TODO only show alert once
    alert('Uh oh, there was some sort of problem. Try refreshing the page.');
    throw new Error('MyNextMUNI error');
}

myNextMuni.db.addStop = function(stop) {
    var storage = this._loadStorage();
    if (!storage.stops) storage.stops = [];
    storage.stops.push(stop);
    this._saveStorage(storage);
}

myNextMuni.db.getStops = function() {
    var storage = this._loadStorage();
    return storage.stops || [];
}

myNextMuni.db.deleteStop = function(index) {
    var storage = this._loadStorage();
    var stops = storage.stops;
    stops.splice(index, 1);
    this._saveStorage(storage);
}

myNextMuni.db._loadStorage = function() {
    var storage = window.localStorage.getItem('myNextMuni');
    if (!storage) storage = {};
    else storage = JSON.parse(storage);
    return storage;
}

myNextMuni.db._saveStorage = function(storage) {
    window.localStorage.setItem('myNextMuni', JSON.stringify(storage));
    window.localStorage.setItem('myNextMuni:version', '1.0');
}

$(function() {
    myNextMuni.init();
    $.getJSON('routes.json', myNextMuni.initData);


    // TODO refactor
    function d(centerX, centerY, radius, percentage) {
        percentage = percentage % 100;
        var radians = 2 * Math.PI * percentage / 100.0;
        var path = '';
        var startX = centerX - radius;
        var startY = centerY;
        path += 'M ' + startX + ' ' + startY + "\n";
        // TODO end is wrong
        var endX = centerX - radius * Math.cos(radians);
        var endY = centerY - radius * Math.sin(radians);
        var flags = "1, 1"
        if (radians < Math.PI) flags = "0, 1";
        path += 'A ' + radius + ' ' + radius + ', 0, ' + flags + ', ' + endX + ' ' + endY + "\n";
        path += 'L ' + centerX + ' ' + centerY + "\n";
        path += "Z";
        return path;
    }

    // var timer = $('#timer');
    var refreshSpinner = $('#refresh-spinner');
    var percentage = 0.0;
    var delay = 50;
    var totTime = 10 * 1000;
    var interval;
    // TODO don't refresh if page not active
    function startInterval() {
        refreshSpinner.css('-webkit-animation-play-state', 'paused');
        refreshSpinner.css('animation-play-state', 'paused');
        interval = window.setInterval(intervalCallback, delay);
    }
    function intervalCallback() {
        percentage += delay * 100.0 / totTime;
        if (percentage >= 100) {
            window.clearInterval(interval);
            refreshSpinner.css('-webkit-animation-play-state', 'running');
            refreshSpinner.css('animation-play-state', 'running');
            myNextMuni.refresh(startInterval);
            percentage = 0;
        }
        // timer.attr('d', d(25, 25, 16, percentage)); // TODO make dynamic
    }
    startInterval();
});








