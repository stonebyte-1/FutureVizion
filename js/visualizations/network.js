// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3 from "d3";
const W = window.innerWidth;
const H = window.innerHeight;

const soc_identifiers = {
  11: "Management",
  13: "Business & Finance",
  15: "Computer & Math",
  17: "Engineering",
  19: "Science",
  21: "Social Services",
  23: "Legal",
  25: "Education",
  27: "Arts & Media",
  29: "Healthcare",
  31: "Health Support",
  33: "Protective Services",
  35: "Food Service",
  37: "Maintenance",
  39: "Personal Care",
  41: "Sales",
  43: "Admin & Office",
  45: "Agriculture",
  47: "Construction",
  49: "Repair",
  51: "Production",
  53: "Transportation",
};

const svg = d3.select("#network-graph");
const g = svg.append("g");

// Should allow the user to pan and zoom easily
svg.call(
  d3
    .zoom()
    .scaleExtent([0.2, 4])
    .on("zoom", (e) => g.attr("transform", e.transform))
);



d3.json("./data/index.json").then((careerdata) => {
  const careers_p_dept = {};
  careerdata.forEach((d) => {
    careers_p_dept[d.soc_group] = (careers_p_dept[d.soc_group] || 0) + 1;
  });
  const groups = Object.keys(soc_identifiers).map((key) => ({
    key,
    count: careers_p_dept[key] || 0,
  }));
});
