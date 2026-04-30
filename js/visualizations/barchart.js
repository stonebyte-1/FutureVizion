import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import * as d3 from "d3";
const width = 900;
const height = 600;
const margin = { top: 40, right: 40, bottom: 50, left: 250 };

const svg = d3
    .select("#barchart-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#barchart-tooltip");

// LOAD DATA
Promise.all([d3.csv("data/job_exposure.csv"), d3.csv("data/all_careers.csv")])
    .then(([exposureData, careerData]) => {
        // ===== CLEAN CAREER DATA =====
        const grouped = d3.group(careerData, (d) => d.occupation_title);
        const careerMap = new Map();
        console.log(grouped);

        grouped.forEach((values, job) => {
            const salaries = values
                .map((d) => +d.median_annual_wage_2024)
                .filter((d) => !isNaN(d));
            const growths = values
                .map((d) => +d["Employment Percent Change, 2024-2034"])
                .filter((d) => !isNaN(d));

            careerMap.set(job, {
                salary: d3.mean(salaries) || 0,
                growth: d3.mean(growths) || 0,
            });
        });

        // ===== NORMALIZATION =====
        const allSalaries = Array.from(careerMap.values()).map((d) => d.salary);
        const allGrowths = Array.from(careerMap.values()).map((d) => d.growth);

        const salaryExtent = d3.extent(allSalaries);
        const growthExtent = d3.extent(allGrowths);

        const normalize = (val, min, max) => {
            if (max === min) return 0;
            return (val - min) / (max - min);
        };

        // ===== FILTER FOR CS/TECH JOBS & BUILD FINAL DATA =====
        // Regex to match common tech/CS titles
        const techRegex =
            /computer|software|data|web|network|database|programmer|information security|developer/i;

        let data = exposureData
            .filter((d) => techRegex.test(d.title)) // Keep only tech jobs
            .map((d) => {
                const job = d.title;
                const risk = +d.observed_exposure * 100;
                const career = careerMap.get(job);

                let opportunity = 0;
                let salary = 0;
                let growth = 0;

                if (career) {
                    salary = career.salary;
                    growth = career.growth;

                    const salaryNorm = normalize(
                        salary,
                        salaryExtent[0],
                        salaryExtent[1],
                    );
                    const growthNorm = normalize(
                        growth,
                        growthExtent[0],
                        growthExtent[1],
                    );

                    opportunity = (salaryNorm * 0.5 + growthNorm * 0.5) * 100;
                }

                return {
                    job,
                    risk: isNaN(risk) ? 0 : risk,
                    opportunity,
                    salary,
                    growth,
                };
            })
            .filter((d) => d.job && d.salary > 0 && d.risk > 0);

        // ===== SORT & LIMIT TO 10 JOBS =====
        data.sort((a, b) => b.opportunity - a.opportunity);
        data = data.slice(0, 10);

        // ===== SCALES =====
        const y = d3
            .scaleBand()
            .domain(data.map((d) => d.job))
            .range([margin.top, height - margin.bottom])
            .padding(0.3);

        const x = d3
            .scaleLinear()
            .domain([-100, 100])
            .range([margin.left, width - margin.right]);

        // ===== CENTER LINE =====
        svg
            .append("line")
            .attr("x1", x(0))
            .attr("x2", x(0))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke", "#333")
            .attr("stroke-width", 2);

        // ===== LEFT BARS (AI RISK) =====
        svg
            .selectAll(".bar-risk")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-risk")
            .attr("x", (d) => x(-d.risk))
            .attr("y", (d) => y(d.job))
            .attr("rx", "6px")
            .attr("width", (d) => x(0) - x(-d.risk))
            .attr("height", y.bandwidth())
            .on("mouseover", function (event, d) {
                // Grow the bar
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("y", y(d.job) - 4)
                    .attr("height", y.bandwidth() + 8)
                    .attr("rx", "10px")
                    .style("opacity", 0.7);
                tooltip.style("opacity", 1);
            })
            .on("mousemove", function (event, d) {
                tooltip
                    .html(`<strong>${d.job}</strong><br>AI Risk: ${d.risk.toFixed(1)}%`)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function (event, d) {
                // Shrink the bar back to normal
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("y", y(d.job))
                    .attr("height", y.bandwidth())
                    .attr("rx", "6px")
                    .style("opacity", 1);
                tooltip.style("opacity", 0);
            });

        // ===== RIGHT BARS (OPPORTUNITY) =====
        svg
            .selectAll(".bar-opportunity")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-opportunity")
            .attr("x", x(0))
            .attr("y", (d) => y(d.job))
            .attr("rx", "6px")
            .attr("width", (d) => x(d.opportunity) - x(0))
            .attr("height", y.bandwidth())
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("y", y(d.job) - 4)
                    .attr("height", y.bandwidth() + 8)
                    .attr("rx", "10px")
                    .style("opacity", 0.7);
                tooltip.style("opacity", 1);
            })
            .on("mousemove", function (event, d) {
                tooltip
                    .html(
                        `
          <strong>${d.job}</strong><br>
          Opportunity Score: ${d.opportunity.toFixed(1)}<br>
          Avg Salary: $${Math.round(d.salary).toLocaleString()}<br>
          Projected Growth: ${d.growth.toFixed(1)}%
        `,
                    )
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("y", y(d.job))
                    .attr("height", y.bandwidth())
                    .attr("rx", "6px")
                    .style("opacity", 1);
                tooltip.style("opacity", 0);
            });

        // ===== AXES =====
        const yAxis = svg
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));

        yAxis.select(".domain").remove();
        yAxis
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-family", "Arial, sans-serif");

        const xAxis = svg
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(8)
                    .tickFormat((d) => Math.abs(d)),
            );

        xAxis.selectAll("text").style("font-size", "11px");
    })
    .catch((error) => console.error("Error loading CSVs:", error));
