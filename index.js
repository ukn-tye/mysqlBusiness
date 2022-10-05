// require dependencies //
const mysql = require("mysql2");
const inquirer = require('inquirer');
require("console.table");
require("dotenv").config();

// initial message //
console.log("")
console.log(" ========================================")
console.log("           EMPLOYEE BUSINESS TRACKER")
console.log(" ========================================")
console.log("")

// setup connection to the database // 
const connection = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "employees_db",
  });
  
  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to employees_db as " + connection.threadId + "\n");
    start();
  });
  
  // initial inquirer prompts //
  function start() {
    inquirer.prompt([

        // navigation options //
        {
            type: "list",
            name: "nav",
            message: "What would you like to do?",
            choices: [
                "View All Employees",
                "View All Roles",
                "View All Departments",
                "View All Employees By Department",
                "Add Employee",
                "Add Department",
                "Add Role",
                "Update Employee Role",
                "Quit",
            ],
        },
    ])
    .then(function (data) {

        // switch statement to run functions depending on user selection //
        switch (data.nav) {
          case "View All Employees":
            viewAllEmployees();
            break;
          case "View All Roles":
            viewAllRoles();
            break;
          case "View All Departments":
            viewAllDepartments();
            break;
          case "View All Employees By Department":
            viewEmployeeDepartment();
            break;
          case "Add Employee":
            addEmployee();
            break;
          case "Add Department":
            addDepartment();
            break;
          case "Add Role":
            addRole();
            break;
          case "Update Employee Role":
            updateEmployeeRole();
            break;
          case "Quit":
            quit();
            break;
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

// CRUD Functions //

// CREATE //

function addEmployee() {
  console.log("-------------------------------------");
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;

    // Use result to setup an object for the inquirer's department choices
    const myDeps = res.map(function (deps) {
      return { 
        name: deps.name,
        value: deps.id 
      };
    });

    inquirer
      .prompt([
        {
          type: "input",
          name: "first_name",
          message: "What is the employee's first name?"
        },
        {
          type: "input",
          name: "last_name",
          message: "What is the employee's last name?"
        },
        {
          type: "list",
          name: "department",
          message: "What is the new employee's department?",
          choices: myDeps
        }
      ])
      .then(function (data) {
        const newEmp = data;
        // New query looks to assign the employee a role given the specified department
        connection.query("SELECT * FROM role WHERE department_id ="+newEmp.department+"", function (err, res) {
          if (err) throw err;

          const myRole = res.map(function (roles) {
            return { 
              name: roles.title,
              value: roles.id 
            };
          });

          inquirer
            .prompt([
              {
                type: "list",
                name: "roles",
                message: "Select a role:",
                choices: myRole
              }
            ])
            .then(function(data){
              const newRole = data.roles;
              // Select a manager from the employee table
              connection.query("SELECT id,CONCAT(first_name, ' ', last_name) AS manager FROM employee", function(err, res){
                if (err) throw err;

                const myMan = res.map(function(man){
                  return {
                    name: man.manager,
                    value: man.id
                  }
                })
               inquirer
                .prompt([
                  {
                    type: "list",
                    name: "manager",
                    message: "Select a Manager for the employee:",
                    choices: myMan
                  }
                ]).then(function(data){
                  // Now insert the new employee into the employee table with all the gathered data
                  connection.query(
                    "INSERT INTO employee SET ?",
                    {
                      first_name: newEmp.first_name,
                      last_name: newEmp.last_name,
                      role_id: newRole,
                      manager_id: data.manager

                    }
                   , function(err, res) {
                     if (err) throw err;
                     viewAllEmployees();
                    }
                  )
                })
              })
            })
        })
      })
  });
}

// add a role //

function addRole() {
  console.log("-------------------------------------");
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;

    const myDeps = res.map(function (deps) {
      return { 
        name: deps.name,
        value: deps.id 
      };
    });

    inquirer
      .prompt([
        {
          type: "input",
          name: "title",
          message: "What is the new role's title?"
        },
        {
          type: "input",
          name: "salary",
          message: "What is the new role's salary?"
        },
        {
          type: "list",
          name: "department",
          message: "What is the new role's department?",
          choices: myDeps
        }
      ])
      .then(function (data) {
        connection.query("INSERT INTO role SET ?",
          {
            title: data.title,
            salary: data.salary,
            department_id: data.department,
          },
          function (err, res) {
            if (err) throw err;
            viewAllRoles()
          }
        );
      });
  });
}

function addDepartment() {
  inquirer
    .prompt([
      // List navigation options //
      {
        type: "input",
        name: "department",
        message: "What is the new department's name?",
      },
    ])
    .then(function (data) {
      connection.query(
        "INSERT INTO department SET ?",
        {
          name: data.department
        },
       function(err, res){
        if (err) throw err;
        viewAllDepartments();
       }
      )
    })
}

// READ //

// view all employees //
function viewAllEmployees() {
  connection.query("SELECT eleft.first_name, eleft.last_name, title, name as department, salary, CONCAT(eright.first_name, ' ', eright.last_name) AS manager FROM employee as eLeft LEFT JOIN role ON eleft.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee eright ON eleft.manager_id = eright.id", function (err, res) {
    if (err) throw err;
    console.table(
      "-------------------------------------",
      "All Employees:",
      "-------------------------------------",
      res
    );
    start();
  });
}

// view all roles //
function viewAllRoles() {
  connection.query("SELECT role.id, title, name as department FROM role LEFT JOIN department ON role.department_id = department.id", function (err, res) {
    if (err) throw err;
    console.table(
      "-------------------------------------",
      "All Roles:",
      "-------------------------------------",
      res
    );
    start();
  });
}

// view all departments //
function viewAllDepartments() {
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;
    console.table(
      "-------------------------------------",
      "All Departments:",
      "-------------------------------------",
      res
    );
    start();
  });
}

// view all employee departments //
function viewEmployeeDepartment() {
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;

    const myDeps = res.map(function (deps) {
      return { 
        name: deps.name,
        value: deps.id 
      };
    });

    inquirer
      .prompt([
        {
          type: "list",
          name: "department",
          message: "Select a department to view its employees:",
          choices: myDeps
        }
      ])
      .then(function (data) {
        connection.query("SELECT eleft.first_name, eleft.last_name, title, name as department, salary, CONCAT(eright.first_name, ' ', eright.last_name) AS manager FROM employee as eLeft LEFT JOIN role ON eleft.role_id = role.id LEFT JOIN department ON role.department_id = department.id RIGHT JOIN employee eright ON eleft.manager_id = eright.id WHERE department.id="+data.department+"", function (err, res) {
          if (err) throw err;
          console.table(
            "-------------------------------------",
            "All Employees in the " + myDeps[data.department-1].name + " department:",
            "-------------------------------------",
            res
          );
          start();
        });
      })
    })
}

// UPDATE //

// update employee role //
function updateEmployeeRole() {
  connection.query("SELECT id,CONCAT(first_name, ' ', last_name) AS emp FROM employee", function(err, res){
    if (err) throw err;

    const empUpdate = res.map(function(empData){
      return {
        name: empData.emp,
        value: empData.id
      }
    })
   inquirer
    .prompt([
      {
        type: "list",
        name: "employee",
        message: "Which employee's role would you like to change?:",
        choices: empUpdate
      }
    ]).then(function(data){
      const empUpdate = data.employee;
      connection.query("SELECT * FROM role", function (err, res) {
        if (err) throw err;

        const myRole = res.map(function (roles) {
          return { 
            name: roles.title,
            value: roles.id 
          };
        });

        inquirer
          .prompt([
            {
              type: "list",
              name: "roles",
              message: "Pick a role:",
              choices: myRole
            }
          ]).then(function(data){
            connection.query(
              "UPDATE employee SET role_id= "+data.roles+" WHERE id="+empUpdate+"",
               function(err, res)
              {
              if (err) throw err;
              viewAllEmployees();
              }
            )
          })
        })
    })
  })
}

// quit //
function quit() {
  console.log("-------------------------------------");
  console.log("Farewell");
  console.log("-------------------------------------");
  connection.end();
}