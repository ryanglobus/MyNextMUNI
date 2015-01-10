<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0;">
        <title>My Next MUNI</title>
        <link rel="stylesheet" type="text/css" href="bootstrap/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="style.css" />
        <script src="jquery-2.1.1.min.js"></script>
        <script src="bootstrap/js/bootstrap.min.js"></script>
        <script src="script.js"></script>

    </head>

    <body>
        <div id="loading"></div>
        
        <nav class="navbar navbar-default" role="navigation">
          <div class="container-fluid">
            <div class="navbar-header">
              <a class="navbar-brand" href="#">My Next MUNI</a>
                <p class="navbar-right">
                    <a href="#" class="navbar-link" onclick="myNextMuni.toggleEdit()">Edit</a>
                    <a href="#" class="navbar-link"><span id="refresh-spinner" class="glyphicon glyphicon-refresh"></span></a>
                </p>
            </div>
            <div class="collapse navbar-collapse">
            </div>
          </div>
        </nav>

        <div class="container">
            <div class="row">
                <!-- <button type="button" class="btn btn-primary col-xs-12 col-sm-4">Add Stop</button> -->
                <ul id="predictions">
                    <li id="stop-li-template" class="template stop">
                        <span class="delete-button glyphicon glyphicon-minus-sign" onclick="myNextMuni.deleteButton(event)"></span>
                        <div class="well">
                            <h5 data-role="title"></h5>
                            <p data-role="predictions">
                                <span>Next:</span>
                            </p>
                        </div>
                    </li>
                </ul>
                <form id="new-stop-form" class="col-xs-12 form-group">
                    <select name="route" class="form-control">
                        <option disabled selected>Select a Route...</option>
                    </select>
                    <select name="direction" class="form-control" disabled>
                        <option disabled selected>Select a Direction...</option>
                    </select>
                    <select name="stop" class="form-control" disabled>
                        <option disabled selected>Select a Stop...</option>
                    </select>
                    <button id="new-stop-button" type="button" class="btn btn-success" disabled>Add Stop</button>
                </form>
            </div>
        </div>
    </body>
</html>