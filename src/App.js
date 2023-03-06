import "./styles.css";
import React, { useState } from "react";

export default function App() {
  const csvFilePath = "./data/Transactions.csv";
  const [status, setStatus] = useState("Click button to start...");
  //State to store table Column name
  const [tableRows, setTableRows] = useState([]);
  const [tableRowsPts, setTableRowsPts] = useState([]);
  //State to store the values
  const [values, setValues] = useState([]);
  const [valuesPts, setValuesPts] = useState([]);
  // Page Section Titles
  const [titleTrans, setTitleTrans] = useState([]);
  const [titlePts, setTitlePts] = useState([]);

  // Read Csv and return promise allowing await
  const getTransactions = async () => {
    setStatus("Try to Load Transactions...");
    try {
      const response = await fetch(csvFilePath);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.text();
      setStatus(status + "\nTransactions Data Loaded...");
      return data;
    } catch (error) {
      console.error(`Could not get transactions: ${error}`);
      setStatus(status, "<BR>Could Not Load Transactions Data: ", error);
    }
  };

  // Convert CSV data to array of objects
  const csvToArr = (stringVal, splitter) => {
    const [keys, ...rest] = stringVal
      .trim()
      .split("\n")
      .map((item) => item.split(splitter));

    const objArr = rest.map((item) => {
      const object = {};
      keys.forEach((key, index) => (object[key] = item.at(index)));
      return object;
    });
    return objArr;
  };

  // load the data
  let data;
  const addToStatus = (str) => {
    let newStatus = "\r\n" + str;
    setStatus(newStatus);
  };

  // calculate POINTS based on transaction amount
  const calcPoints = (amount) => {
    if (amount < 50) {
      console.log("fell into < 50 ", amount);
      return 0;
    } else if (amount > 49 && amount <= 100) {
      console.log("fell into 50 - 100 ", amount);
      return amount - 50;
    } else if (amount > 100) {
      console.log("fell into> 100 ", amount);
      return 50 + (amount - 100) * 2;
    } else {
      // something went wrong
      return 0;
    }
  };

  const handleClick = () => {
    // fetch a file from the public directory
    getTransactions().then((csvString) => {
      console.log("Loaded CSV string=", csvString);
      addToStatus("CSV Data Loaded...");
      data = csvToArr(csvString, ",");
      console.log("Array of data=", data);
      addToStatus("Data Converted to Objects...");
      //setStatus(status + "\nData Converted to Objects...");

      // OK let's at least display the data we loaded
      // in a TABLE
      const rowsArray = [];
      const valuesArray = [];
      data.map((d) => {
        rowsArray.push(Object.keys(d));
        valuesArray.push(Object.values(d));
        return null;
      });
      // Filtered Column Names
      setTableRows(rowsArray[0]);
      // Filtered Values
      setValues(valuesArray);

      // Now time to do tha points calcs

      // use phone as unique customer id
      //const cust_ids = [...new Set(data.map((trans) => trans.phone))];
      const customersDirty = [
        ...new Map(data.map((trans) => [trans["phone"], trans])).values()
      ];
      // remove customer props related to transaction
      const customers = customersDirty.map(
        ({ trans_date, trans_id, amount, ...keepAttr }) => keepAttr
      );
      console.log("Unique customers=", customers);
      addToStatus("Unique Customers Found:", customers.length);

      // now add transactions to each customer
      customers.forEach((customer) => {
        customer.transactions = [
          ...new Set(data.filter((trans) => trans.phone === customer.phone))
        ];
        //console.log("customer trans=", customer.transactions);
      });

      // Calc per month totals for each customer

      // Now calculate the total points using
      /* reducer method that takes in the accumulator and next item */
      const reducerTotal = (accum, item) => {
        //console.log("item", item, item.fname, item.cc_num, item.month);
        let amount = item.price ? item.price.replace(/\$/g, "") : 0;
        let total = parseInt(accum) + calcPoints(parseInt(amount));
        //console.log("clean amount,totalPoints", amount, total);
        return total;
      };

      /* use reduce method & reducer function to calc total
        and our initial value = 0 */
      customers.forEach((customer, i) => {
        customer.transactions.forEach((trans) => {
          // figure out the month
          const [month, day, year] = trans.trans_date.split("/");
          trans.month = month;
          //console.log("month=", month);
        });

        addToStatus("Calculating January Points....");
        customer.january_points = customer.transactions
          .filter((obj) => {
            return obj.month === "1";
          })
          .reduce(reducerTotal, 0);
        addToStatus("Calculating February Points...");
        customer.february_points = customer.transactions
          .filter((obj) => {
            return obj.month === "2";
          })
          .reduce(reducerTotal, 0);
        addToStatus("Calculating March Points...");
        customer.march_points = customer.transactions
          .filter((obj) => {
            return obj.month === "3";
          })
          .reduce(reducerTotal, 0);
        addToStatus("Calculating Total Points...");
        customer.total_points = customer.transactions.reduce(reducerTotal, 0);

        addToStatus("Calculations Fully Complete!");
        console.log("customer.january_points=", customer.january_points);
        console.log("customer.february_points=", customer.february_points);
        console.log("customer.march_points=", customer.march_points);
        console.log("customer.totalPoints=", customer.total_points);
      });
      const rowsArray2 = [];
      const valuesArray2 = [];
      // remove unwanted cols
      const customerPoints = customers.map(
        ({ trans_id, phone, cc_num, price, transactions, ...keepAttr }) =>
          keepAttr
      );
      customerPoints.map((d) => {
        rowsArray2.push(Object.keys(d));
        valuesArray2.push(Object.values(d));
        return null;
      });
      // Filtered Column Names
      setTableRowsPts(rowsArray2[0]);
      // Filtered Values
      setValuesPts(valuesArray2);
      setTitlePts("Calculated Customer Reward Points:");
      setTitleTrans("Based on These Transactions:");
      console.log("Final customers=", customers);
    }); // end .then
  }; // end .getTransactions

  return (
    <div className="App">
      <h1>Turner Fishing Store</h1>
      <h2>Customer Transaction Analyzer</h2>
      <button className="btnData" onClick={handleClick}>
        Load Data
      </button>
      <h3>{status}</h3>
      <br />
      <br />
      {/* Table of Points */}
      <h2>{titlePts}</h2>
      <table>
        <thead>
          <tr>
            {tableRowsPts.map((rows, index) => {
              return <th key={index}>{rows}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {valuesPts.map((value, index) => {
            return (
              <tr key={index}>
                {value.map((val, i) => {
                  return <td key={i}>{val}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <br />
      {/* Table of Transactions */}
      <h2>{titleTrans}</h2>
      <table>
        <thead>
          <tr>
            {tableRows.map((rows, index) => {
              return <th key={index}>{rows}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {values.map((value, index) => {
            return (
              <tr key={index}>
                {value.map((val, i) => {
                  return <td key={i}>{val}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
