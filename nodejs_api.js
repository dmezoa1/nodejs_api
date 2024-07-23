const express = require('express')
const oracledb = require('oracledb');
const bodyparser = require('body-parser');
const error_handler = require('errorhandler');

const app = express();
const parser = bodyparser.json();

const port = 50080;
var password = 'Fit_007!JupMerken';

db_config= {
      user: "fitstudy",
      password: password,
      connectString: "lxadxd33:2430/INFRA3"
}


async function selectAllIssues(req, res) {
  try {
    connection = await oracledb.getConnection(db_config);

    console.log('connected to database');
    // run query to get all employees
    result = await connection.execute(`SELECT * FROM ISSUE_COPY`);

  } catch (err) {
    //send error message
    return res.send(err.message);
  } finally {
    if (connection) {
      try {
        // Always close connections
        await connection.close();
        console.log('close connection success');
      } catch (err) {
        console.error(err.message);
      }
    }
    if (result.rows.length == 0) {
      //query return zero employees
      return res.send('query send no rows');
    } else {
      //send all employees
      return res.send(result.rows);
    }

  }
}

app.use(error_handler());
app.use(parser);

//get /issues
app.get('/issues', function (req, res) {
  selectAllIssues(req, res);
})


async function selectIssueById(req, res, id) {
  try {
    connection = await oracledb.getConnection(db_config);
    // run query to get issue with given issue_id
    result = await connection.execute(`SELECT * FROM ISSUE_COPY where ISSUE_ID=:id`, [id]);

  } catch (err) {
    //send error message
    return res.send(err.message);
  } finally {
    if (connection) {
      try {
        // Always close connections
        await connection.close();
      } catch (err) {
        return console.error(err.message);
      }
    }
    if (result.rows.length == 0) {
      //query return zero issues
      return res.send('query send no rows');
    } else {
      //send all issues
      return res.send(result.rows);
    }
  }
}

//get /issue?id=<id issue>
app.get('/issue', function (req, res) {
  //get query param ?id
  let id = req.query.id;
  // id param if it is number
  if (isNaN(id)) {
    res.send('Query param id is not number')
    return
  }
  selectIssueById(req, res, id);
})


const updateSQL =
    `UPDATE ISSUE_COPY
    SET ISSUE_ID = :ISSUE_ID,
    ASSIGNEE = :ASSIGNEE,
    CLOSE_DATE = TO_DATE(:CLOSE_DATE, 'YYYY-MM-DD'),
    JIRA_ID = :JIRA_ID,
    ISSUE_TYPE = :ISSUE_TYPE,
    JIRA_KEY = :JIRA_KEY,
    STATUS = :STATUS,
    MESSAGE = :MESSAGE,
    VERSION_NUMBER = :VERSION_NUMBER,
    VERSION_NAME = :VERSION_NAME,
    TEST_COL = :TEST_COL
    WHERE ISSUE_ID =:ISSUE_ID`;

async function update(param) {
  const issue = Object.assign({}, param);
  let result;
  try{
      connection = await oracledb.getConnection(db_config);
      result = await connection.execute(updateSQL, issue, {autoCommit: true});
  } catch(err) {
      console.error(err);
      throw(err);
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (err){
              console.error(err);
          }
      }
  }
  if(result.rowsAffected == 1) {
    return issue;
  } else {
    return null;
  }
}

function getIssueFromRequest(req) {
  console.log("parsing");
  const issue = {
    ISSUE_ID : parseInt(req.query.issue_id, 10),
    ASSIGNEE : req.body.assignee,
    CLOSE_DATE : req.body.close_date,
    JIRA_ID : req.body.jira_id,
    ISSUE_TYPE : req.body.issue_type,
    JIRA_KEY : req.body.jira_key,
    STATUS : req.body.jira_status,
    MESSAGE : req.body.message,
    VERSION_NUMBER : req.body.version_number,
    VERSION_NAME : req.body.version_name,
    TEST_COL : req.body.test_col
  };
  console.log(issue.ISSUE_ID);
  return issue;
}

//PUT
app.put('/issue', (req,res) => {
  console.log(req.body);
  const issue = getIssueFromRequest(req);
  let result = update(issue);
  res.send(result);
})

const insertSQL =
    `INSERT INTO ISSUE_COPY
    (ISSUE_ID, ASSIGNEE, CLOSE_DATE, JIRA_ID, ISSUE_TYPE, JIRA_KEY,
      STATUS, MESSAGE, VERSION_NUMBER, VERSION_NAME, TEST_COL)
    VALUES
    (:ISSUE_ID, :ASSIGNEE, TO_DATE(:CLOSE_DATE, 'YYYY-MM-DD'),
      :JIRA_ID, :ISSUE_TYPE, :JIRA_KEY, :STATUS, :MESSAGE, :VERSION_NUMBER,
      :VERSION_NAME, :TEST_COL)`;

async function create(param) {
  const issue = Object.assign({}, param);
  let result;
  try{
      connection = await oracledb.getConnection(db_config);
      result = await connection.execute(insertSQL, issue, {autoCommit: true});
  } catch(err) {
      console.error(err);
      throw(err);
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (err){
              console.error(err);
          }
      }
  }
  if(result.rowsAffected == 1) {
    return issue;
  } else {
    return null;
  }
}

//POST
app.post('/issue', async (req, res) => {
  console.log(req.body);
  const issue = getIssueFromRequest(req);
  let result = create(issue);
  res.send(result);
})

const deleteSQL =
    `begin

     DELETE FROM ISSUE_COPY WHERE ISSUE_ID = :ISSUE_ID;

     :rowcount := sql%rowcount;
     end;`;

/*async function deleteFunc(req, res, id) {
  //const ISSUE_ID = Object.assign({}, param);
  let result;
  console.log(id);
  try{
      connection = await oracledb.getConnection(db_config);
      connection.callTimeout = 5000;
      console.log("Database connected");
      //result = await connection.execute(deleteSQL, [ISSUE_ID], {autoCommit: true});
      const binds = {
        ISSUE_ID: id
      }
      const options = {
        dmlRowCounts: true,
        autoCommit: true ,
        bindDefs: [
        { type: oracledb.NUMBER }
        ]
      };
      result = await connection.execute(`DELETE FROM ISSUE_COPY WHERE ISSUE_ID=:issue_id`, [req.query.issue_id],  {autoCommit: true});
      console.log("Result is:", result);
      console.log("Delete done, result: \n");
      console.log(result);
      //console.log(result.warning.message);
  } catch(err) {
      console.error(err);
      //return res.send(err.message);
      throw(err);
  } finally {
       console.log("finally");
       if (connection) {
          try {
              await connection.close();
          } catch (err){
              console.error(err);
          }
      }
  }
  //if(result.rowsAffected != 0) {
  //   return result;
  //} else {
    return null;
  //}
}

//DELETE
app.delete('/issue', (req,res) => {
  //console.log(req.body);
  //const issue = getIssueFromRequest(req);
  let ISSUE_ID = req.query.issue_id;
  let result = deleteFunc(req, res, ISSUE_ID);
  res.send(result);
})*/

function simpleExecute(statement, binds = [], opts = {}) {
  return new Promise(async (resolve, reject) => {
    let conn;

    opts.outFormat = oracledb.OBJECT;
    opts.autoCommit = true;

    try {
      conn = await oracledb.getConnection(db_config);

      const result = await conn.execute(statement, binds, opts);

      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      if (conn) { // conn assignment worked, need to close
        try {
          await conn.close();
        } catch (err) {
          console.log(err);
        }
      }
    }
  });
}


async function deleteFunc(id) {
  const binds = {
    ISSUE_ID: id,
    rowcount: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER
    }
  }
  const result = await simpleExecute(deleteSQL, binds);

  return result.outBinds.rowcount === 1;
}

//DELETE
//DELETE
app.delete('/issue', (req,res) => {
  //console.log(req.body);
  //const issue = getIssueFromRequest(req);
  const id = parseInt(req.query.issue_id, 10);
  console.log(id);
  //let ISSUE_ID = parseInt(req.query.issue_id, 10);
  let result = deleteFunc(id);
  res.send(result);
})

app.listen(port, () => console.log("nodeOracleRestApi app listening on port %s!", port))




/// EXPRESS SENDS response 200 as default even on error, needs to be set/handled manually!!!
