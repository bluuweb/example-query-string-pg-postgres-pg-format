import { config } from "dotenv";
config();

import express from "express";
import pool from "./database/connection.js";
import format from "pg-format";
import { verifyJWT } from "./middlewares/verifyJWT.js";

const app = express();

app.get("/medicamentos", verifyJWT, async (req, res) => {
  let query = "SELECT * FROM medicamentos";
  let arrayFormat = [];

  const { limit = 5, sort, page = 1, filters } = req.query;

  if (filters) {
    query += " WHERE ";
    const propertys = Object.keys(filters);

    const operatorsQueryObjet = {
      $eq: "=",
      $gt: ">",
      $gte: ">=",
      $lt: "<",
      $lte: "<=",
      $ne: "!=",
    };

    for (const key in filters) {
      const name = key;
      const object = filters[name];
      const operator = Object.keys(object)[0];
      const value = object[operator];

      query += "%s %s '%s'";

      arrayFormat.push(name, operatorsQueryObjet[operator], value);

      if (key !== propertys[propertys.length - 1]) {
        query += " AND ";
      }
    }
  }

  if (sort) {
    const [property] = Object.keys(sort);
    arrayFormat.push(property, sort[property]);
    query += " ORDER BY %s %s";
  }

  if (limit) {
    arrayFormat.push(limit);
    query += " LIMIT %s";
  }

  if (page && limit) {
    arrayFormat.push((page - 1) * limit);
    query += " OFFSET %s";
  }

  try {
    const formattedQuery = format(query, ...arrayFormat);
    const { rows } = await pool.query(formattedQuery);

    const results = rows.map((row) => {
      return {
        name: row.nombre,
        href: `http://localhost:3000/medicamentos/${row.id}`,
      };
    });

    const text = "SELECT * FROM medicamentos";
    const { rows: data } = await pool.query(text);
    const total_pages = Math.ceil(data.length / limit);

    return res.json({
      results,
      meta: {
        total: data.length,
        limit: parseInt(limit),
        page: parseInt(page),
        total_pages: total_pages,
        next:
          total_pages <= page
            ? null
            : `http://localhost:3000/medicamentos?limit=${limit}&page=${
                parseInt(page) + 1
              }`,
        previous:
          page <= 1
            ? null
            : `http://localhost:3000/medicamentos?limit=${limit}&page=${
                parseInt(page) - 1
              }`,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, result: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log("Server ON"));
