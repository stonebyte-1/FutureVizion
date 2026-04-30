// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3 from "d3";
const C = (v) =>
  getComputedStyle(document.documentElement).getPropertyValue(v).trim();
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
  function showGroup(key, allCareers) {
    g.selectAll("circle").remove();
    g.selectAll("text").remove();
    main_simu.stop();
    document.getElementById("back").style.display = "block";

    const careers = allCareers.filter((d) => d.soc_group == key);
    const ids = new Set(careers.map((d) => d.onetsoccode));
    ///console.log(careers); this was just for testing purposes to see if the function worked now it can be disregarded
    d3.json("./data/links.json").then((allLinks) => {
      const groupLinks = allLinks.filter(
        (l) => ids.has(l.source) && ids.has(l.target)
      );
      const career_size = d3
        .scaleSqrt()
        .domain([0, d3.max(careers, (d) => d.total_employment_2024 || 1)])
        .range([4, 18]);

      const career_sim = d3
        .forceSimulation(careers)
        .force(
          "link",
          d3
            .forceLink(groupLinks)
            .id((d) => d.onetsoccode)
            .distance(10)
            .strength(0.5)
        )
        .force("charge", d3.forceManyBody().strength(-80))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force(
          "collide",
          d3.forceCollide(
            (d) => career_size(d.total_employment_2024 || 1) + 100
          )
        );
      const link = g
        .selectAll("line")
        .data(groupLinks)
        .join("line")
        .attr("stroke", C("--future-vision-text-color"))
        .attr("stroke-width", 1);

      const career_nodes = g
        .selectAll("circle")
        .data(careers)
        .join("circle")
        .attr("r", (d) => career_size(d.total_employment_2024 || 1))
        .attr("fill", C("--future-vision-primary-color"))
        .attr("opacity", 0.85);
      const IC_Labels = g
        .selectAll("text")
        .data(careers)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("fill", "gray")
        .attr("pointer-events", "none")
        .text((d) =>
          d.occupation_title.length > 20
            ? d.occupation_title.slice(0, 18) + "…"
            : d.occupation_title
        );
      career_nodes.on("click", (e, d) => {
        d3.json(`./data/careers/${d.onetsoccode}.json`).then((p) => {
          document.getElementById("panel-title").textContent = p.TITLE;
          document.getElementById("panel-body").innerHTML = `
                  <div><span style="color:white">Median Salary: </span>$${(
                    p["MEDIAN SALARY 2024"] || 0
                  ).toLocaleString()}</div>
                  <div><span style="color:white">Total Employment: </span>${(
                    p["TOTAL EMPLOYMENT"] || 0
                  ).toLocaleString()}</div>
                  <div><span style="color:white">Employment Change: </span>${
                    p["EMPLOYMENT PERCENT CHANGE"] ?? "N/A"
                  }%</div>
                  <div><span style="color:white">Observed AI Exposure: </span>${
                    p["OBSERVED AI EXPOSURE"] != null
                      ? (p["OBSERVED AI EXPOSURE"] * 100).toFixed(1) + "%"
                      : "No data"
                  }</div>
              `;
          document.getElementById("panel").style.display = "block";
        });
      });

      career_sim.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
        career_nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        IC_Labels.attr("x", (d) => d.x).attr(
          "y",
          (d) => d.y - career_size(d.total_employment_2024 || 1) - 4
        );
      });
      document.getElementById("search").style.display = "block";

      d3.select("#search").on("input", function () {
        const q = this.value.toLowerCase();
        career_nodes.style("opacity", (d) =>
          !q || d.occupation_title.toLowerCase().includes(q) ? 1 : 0.1
        );
      });
    });
  }
  const careers_p_dept = {};
  careerdata.forEach((d) => {
    careers_p_dept[d.soc_group] = (careers_p_dept[d.soc_group] || 0) + 1;
  });
  const groups = Object.keys(soc_identifiers).map((key) => ({
    key,
    count: careers_p_dept[key] || 0,
  }));

  const size_scale = d3
    .scaleSqrt()
    .domain([0, d3.max(groups, (d) => d.count)])
    .range([20, 60]);
  const main_simu = d3
    .forceSimulation(groups)
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(W / 2, H / 2))
    .force(
      "collide",
      d3.forceCollide((d) => size_scale(d.count) + 10)
    );

  const nodes = g
    .selectAll("circle")
    .data(groups)
    .join("circle")
    .attr("r", (d) => size_scale(d.count))
    .attr("fill", C("--future-vision-primary-color"))
    .attr("opacity", 0.85);
  const label = g
    .selectAll("text")
    .data(groups)
    .join("text")
    .attr("text-anchor", "middle")
    .attr("fill", C("--future-vision-text-color"))
    .attr("font-size", 40)
    .attr("pointer-events", "none")
    .text((d) => soc_identifiers[d.key]);
  nodes.on("click", (e, d) => {
    showGroup(d.key, careerdata);
  });

  main_simu.on("tick", () => {
    nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    label.attr("x", (d) => d.x).attr("y", (d) => d.y + 4);
  });
});
document.getElementById("back").onclick = () => {
  location.reload();
  document.getElementById("search").style.display = "none";
  document.getElementById("search").value = "";
};
document.getElementById("close").onclick = () => {
  document.getElementById("panel").style.display = "none";
};
