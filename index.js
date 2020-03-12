const mysql = require('mysql');

const express = require('express');
let app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));

app.set('view engine', 'ejs');

const dbcon = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});

dbcon.connect((err) => {
    if ( !err ) {
        console.log('MySQL database is successfully connected!');
    } else {
        console.send(err);
    }
});

app.listen(3001, (err) => {
    if ( !err ) {
        console.log('Aplication is running at port 3000.');
    } else {
        console.send(err);
    }
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/getAllInstTypes', (req, res) => {

    getAllInstTypes().then(data => {
        res.render('types_of_institutions', {
            types_of_institutions : data,
            message : ''
        });
    })
    .catch(err => {
        res.render('types_of_institutions', {
            message : 'ERROR: ' + err
        });
    });
});

app.get('/getAllEmployees', (req, res) => {
    let query = 'SELECT employees.*, types_of_institutions.TIP_UST FROM employees INNER JOIN types_of_institutions ON employees.TIP_UST = types_of_institutions.TIP_UST;';
    dbcon.query(query, (err, data) => {
        if ( !err ) {
            res.render('employees', {
                employees : data,     //pass the retrieved data to the rendered view as an object
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/"> Go Back</a>'
            });
        }
    });
});


app.get('/addEmployee', (req, res) => {
    let allTypes = [];

    getAllEmployees().then(data => {
        allTypes = data;  

        let query = 'SELECT * FROM employees;';
        dbcon.query(query, (err, data) => {
            if ( !err ) {
                res.render('addEmployee', {
                    employees : allTypes
                });

            } else {
                res.render('addEmployee', {
                    message : 'ERROR: ' + err + '!'
                });
            }
        });
    })
    .catch(err => {    
        res.render('addEmployee', {
            message : 'ERROR: ' + err
        });
    });  
});


app.post('/addEmployee', (req, res) => {
    let query = 'INSERT INTO employees (ZAP_IME, ZAP_SREDNJE_SLOVO, ZAP_PREZIME, ZAP_REDNI_BROJ, TIP_UST) VALUES (?, ?, ?, ?, ?);';    //? (question marks) are paramaters which the query expecting
    dbcon.query(query, [req.body.employeeName, req.body.employeeMidNameFL, req.body.employeeLastName, req.body.employeeID, req.body.inst_type], (err) => {   //pass the submitted data to the query as an array (they must be in the same order as the columns in the query)
        if ( !err ) {
            res.render('message', {  //after successfully excuting the query, render the 'message.ejs' view in order to display the message
                successMessage : 'Employee ' + req.body.employeeName + ' was added successfully.',   //success message
                link : '<a href="/getAllEmployees"> Go Back</a>'   //provide a link that provides a links to another page
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/addEmployee"> Go Back</a>'
            });
        }
    });
});

// the '/:id' part represents a request ID by HTTP. The ID must be concatenated to a link in the view. In this case it will be in the 'states.ejs' view
// this function will not be executed when submitting the edit form. Rather, it is used to display the 'editState.ejs' view and to set initial data of the acquired state
app.get('/editEmployeeById/:ZAP_REDNI_BROJ', (req, res) => {
    let query = 'SELECT * FROM employee WHERE ZAP_REDNI_BROJ = ?';
    dbcon.query(query, req.params.employeeID, (err, data) => {
        if ( !err ) {
            res.render('editEmployee', {
                employees : data[0]
            });
        } else {
            res.send('editEmployee', err);
        }
    });
});


// the '/:id' part represents a request ID by HTTP. Since this is a post function, the ID will be submitted when submitting the edit form
// this is a post funciton, it will be only executing when submitting the edit form in the 'editState.ejs' view
app.post('/editEmployeeById/:ZAP_REDNI_BROJ', (req, res) => {
    /*
    In order for the following query to work, you need to set the property (On DELETE) of all foreign keys in the other tables that reference to the primary key of this table to be 'CASCADE'
    This will also update all child rows in child table to have an update value of the foreign key that references to the parent table
    */
    let query = 'UPDATE employee SET ZAP_IME = ?, ZAP_SREDNJE_SLOVO = ?, ZAP_PREZIME = ?, ZAP_REDNI_BROJ = ? WHERE ZAP_REDNI_BROJ = ?;';
    dbcon.query(query, [req.body.employeeName, req.body.employeeMidNameFL, req.body.employeeLastName, req.body.employeeID, req.params.employeeID], (err) => {
        if ( !err ) {
            res.render('message', {
                successMessage : 'Employee ' + req.body.employeeName + ' was edited successfully!',  //success message
                link : '<a href="/getAllEmployees"> Go back!</a>'      //provide a link that provides a links to another page
            });
        } else {
            res.render('message', {      //In case the query fail. render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/editEmployeeById/' + req.body.employeeID + ' "> Go back!</a>'   //This link will redirect to the edit page of the state with the ID submitted in the form
            });
        }
    });
});


//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


app.get('/deleteStateById/:id', (req, res) => {
    /*
    In order for the following query to work, you need to set the property (On DELETE) of all foreign keys in the other tables that reference to the primary key of this table to be 'CASCADE'
    This will delete all child rows in child tables that reference to the delete row.
    */
    let query = 'DELETE FROM state WHERE DR_IDENTIFIKATOR LIKE ?;'; 
    dbcon.query(query, [req.params.id], (err) => {
        if ( !err ) {
            res.render('message', {
                successMessage : 'State ' + req.params.id + ' was deleted successfully!',  //success message
                link : '<a href="/getAllStates"> Go back!</a>'      //provide a link that provides a links to another page
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/getAllStates"> Go Back</a>'
            });
        }
    });
});

app.get('/getAllPopulatedPlaces', (req, res) => {
    let query = 'SELECT populated_places.*, state.DR_IDENTIFIKATOR, state.DR_NAZIV FROM populated_places INNER JOIN state ON populated_places.DR_IDENTIFIKATOR = state.DR_IDENTIFIKATOR;';
    dbcon.query(query, (err, data) => {
        if ( !err ) {
            res.render('populatedPlaces', {
                populatedPlaces : data,     //pass the retrieved data to the rendered view as an object
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/"> Go Back</a>'
            });
        }
    });
});

//a get function is usd to display the 'addpopulatedPlace.ejs' view
app.get('/addPopulatedPlace', (req, res) => {
    let allStates = [];

    //get all states using the getAllStates() function in order to display them as a dropdown list in the 'addPopulatedPlace.ejs' view, so the user does not assign a non-existing state to a new populated place
    getAllStates().then(data => {
        allStates = data;   //assign the all obtained states to the array 'allStates' in order to pass to the view later as an object

        let query = 'SELECT * FROM state;';
        dbcon.query(query, (err, data) => {
            if ( !err ) {
                res.render('addPopulatedPlace', {
                    states : allStates
                });

            } else {
                res.render('addPopulatedPlace', {
                    message : 'ERROR: ' + err + '!'
                });
            }
        });
    })
    .catch(err => {     //in case of error executing the query, render the 'states.ejs' view and display the obtained error message
        res.render('addPopulatedPlace', {
            message : 'ERROR: ' + err
        });
    });  
});

//a post function that will be executed when submitting the add form in the 'addPopulatedPlace.ejs' view
app.post('/addPopulatedPlace', (req, res) => {
    var allPopulatedPlaces = [];
    
    // getPopulatedPlaceById() will return any populated which has an ID that matching the ID of the newly added populated place. To check whether the new populated place already exists or no, because the ID must be unique
    getAllPopulatedPlaces().then(data => {
        allPopulatedPlaces = data;
        //Check whether a populated place with the same ID exists or no
        for (let populatedPlace of allPopulatedPlaces) {
            if (populatedPlace.NM_IDENTIFIKATOR == parseInt(req.body.id, 10) || populatedPlace.NM_NAZIV == req.body.name) {
                return res.render('message', {
                    errorMessage : 'Populated place ' + req.body.name + ' or ID ' + req.body.id + ', already exists, try again!',
                    link : '<a href="/addPopulatedPlace"> Go Back</a>'   //provide a link that provides a links to another page
                });
            }
        }

        let query = 'INSERT INTO populated_places (DR_IDENTIFIKATOR, NM_IDENTIFIKATOR, NM_NAZIV, NM_PTT_CODE) VALUES (?, ?, ?, ?);';
        dbcon.query(query, [req.body.stateId, parseInt(req.body.id, 10), req.body.name, req.body.pttCode], (err) => {
            if ( !err ) {
                res.render('message', {  //after successfully excuting the query, render the 'message.ejs' view in order to display the message
                successMessage : 'Populated place ' + req.body.name + ' was added successfully.',   //success message
                link : '<a href="/getAllPopulatedPlaces"> Go Back</a>'   //provide a link that provides a links to another page
                });
            } else {
                res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/addPopulatedPlace"> Go Back</a>'
            });
            }
        });
    })
    .catch(err => {     //in case of error executing the query, render the 'states.ejs' view and display the obtained error message
        res.render('message', {  //In case the query fail. Render 'message.ejs' and display the obtained error message
        errorMessage : 'ERROR: ' + err,
            link : '<a href="/addPopulatedPlace"> Go Back</a>'   //provide a link that provides a links to another page
        });
    }); 
});

app.get('/editPopulatedPlaceById/:id', (req, res) => {
    let allStates = [];

    getAllStates().then(data => {
        allStates = data;
        let query = 'SELECT * FROM populated_places WHERE NM_IDENTIFIKATOR = ?;';
        dbcon.query(query, [parseInt(req.params.id, 10)], (err, data) => {
            if ( !err ) {
                res.render('editPopulatedPlace', {
                    states : allStates,
                    populatedPlace: data[0]
                });
            } else {
                res.render('message', {
                    errorMessage : 'ERROR: ' + err + '!',
                    link : '<a href="/editPopulatedPlaceById/' + req.params.id + '"> Go Back</a>'
                });
            }
        });
    })
    .catch(err => {     //in case of error executing the query, render the 'editPopulatedPlace.ejs' view and display the obtained error message
        res.render('message', {
            errorMessage : 'ERROR: ' + err + '!',
            link : '<a href="/editPopulatedPlaceById/' + req.params.id + '"> Go Back</a>'
        });
    }); 
});

app.post('/editPopulatedPlaceById/:id', (req, res) => {
    let query = 'UPDATE populated_places SET DR_IDENTIFIKATOR = ?, NM_IDENTIFIKATOR = ?, NM_NAZIV = ?, NM_PTT_CODE = ? WHERE NM_IDENTIFIKATOR = ?;';
    dbcon.query(query, [req.body.stateId, parseInt(req.body.id, 10), req.body.name, req.body.pttCode, req.params.id], (err) => {
        if ( !err ) {
            res.render('message', {  //after successfully excuting the query, render the 'message.ejs' view in order to display the message
            successMessage : 'Populated place ' + req.body.name + ' was edited successfully.',   //success message
            link : '<a href="/getAllPopulatedPlaces"> Go Back</a>'   //provide a link that provides a links to another page
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
            errorMessage : 'ERROR: ' + err,
            link : '<a href="/editPopulatedPlaceById/' + req.body.id + '"> Go Back</a>'
        });
        }
    });
});

app.get('/deletePopulatedPlaceById/:id', (req, res) => {
    /*
    In order for the following query to work, you need to set the property (On DELETE) of all foreign keys in the other tables that reference to the primary key of this table to be 'CASCADE'
    This will delete all child rows in child tables that reference to the delete row.
    */
    let query = 'DELETE FROM populated_places WHERE DR_IDENTIFIKATOR LIKE ?;'; 
    dbcon.query(query, [req.params.id], (err) => {
        if ( !err ) {
            res.render('message', {
                successMessage : 'Populated place ' + req.params.id + ' was deleted successfully!',  //success message
                link : '<a href="/getAllPopulatedPlaces"> Go back!</a>'      //provide a link that provides a links to another page
            });
        } else {
            res.render('message', {      //In case the query fail. Render 'message.ejs' and display the obtained error message
                errorMessage : 'ERROR: ' + err,
                link : '<a href="/getAllPopulatedPlaces"> Go Back</a>'
            });
        }
    });
});

function getAllEmployees() {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM employees;';
        dbcon.query(query, (err, data) => {
            if ( !err ) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}

function getAllPopulatedPlaces() {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM populated_places;';
        dbcon.query(query, (err, data) => {
            if ( !err ) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}

function getAllInstTypes() {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM types_of_institutions;';
        dbcon.query(query, (err, data) => {
            if ( !err ) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}