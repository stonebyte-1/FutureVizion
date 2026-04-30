import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
/**
https://github.com/s-mahdihosseini/GenAI_Expertise  GenAI_Expertise
This dataset includes occupation level data that we can use for the scatter plot, including occupation work volume exposed to Generative AI, median annual wage from 2024, total employment, and job titles. It is the main dataset we plan to use for this visualization.  


What we plan to visualize 
We plan to visualize which occupations in our dataset are more exposed to Generative AI and compare that to employment size and salary using a scatter plot. 


Key variables we expect to use
GenAI exposure
Total employment
Median annual wage
Occupation title / category

Proof of life
We successfully downloaded and opened the Final_Occupation_Dataset.xlsx file from the GenAI_Expertise dataset. The spreadsheet contains raw occupation-level data that we inspected in Excel, including multiple variables related to Generative AI exposure and other occupation measures. A screenshot of the opened spreadsheet is included as proof that the dataset was accessed and reviewed.

Data Risks or Limitations 
This dataset is recent and useful for our project, but it might still require cleaning before all occupations can be displayed clearly in a single scatter plot. 



https://github.com/AIOE-Data/AIOE
This shows how exposed each occupation is to ai. It gives an ai exposure score by occupation indexed by six digit soc code so this is good for the x axis. Even though its old, its still used in later ai labor research. The two sources below are current enough to balance out the timing of this one

https://www.bls.gov/oes/
Labor market info like employment and wage estimates for around 830 jobs so we can get the median salary for dot size. 

https://www.onetcenter.org/database.html
What the occupations really mean, like their job titles, what category the job falls under

https://github.com/s-mahdihosseini/GenAI_Expertise
Occupation work volume exposed to Generative AI, median annual wage from 2024, total employment, job titles
 */

function remove_accluded_item(d3_svg_item, margin = 3) {
  function bounding_boxes_overlap(box1, box2) {
    return (
      box1.x < box2.x + box2.width - margin &&
      box1.x + box1.width - margin > box2.x &&
      box1.y < box2.y + box2.height - margin &&
      box1.y + box1.height - margin > box2.y
    );
  }
  d3_svg_item.each(function (d) {
    let item_bounding_box = this.getBBox();
    d3_svg_item.each(function (d2) {
      let text2_bounding_box = this.getBBox();
      if (
        bounding_boxes_overlap(item_bounding_box, text2_bounding_box) &&
        d != d2
      ) {
        this.remove();
        return;
      }
    });
  });
}

const scatterContainer = document.getElementById("view-scatter");
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.attributeName === "class" &&
      scatterContainer.classList.contains("active")
    ) {
      renderScatterPlot();
      observer.disconnect();
    }
  });
});
observer.observe(scatterContainer, { attributes: true });

function renderScatterPlot() {
  d3.csv("./data/all_careers.csv").then((data) => {
    const svg = d3.select("#scatter-plot");
    const margin = 100;

    console.log(data);

    const width = window.innerWidth;
    const height = 900;

    const max_point_size = 60;

    const axis_title_margin = 15;
    const tick_number = 10;

    console.log(width, height);

    console.log(data[0]);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin},-${margin})`);

    const x_min = d3.min(data, (d) => {
      return +d.observed_exposure;
    });
    const x_max = d3.max(data, (d) => {
      return +d.observed_exposure;
    });
    /**
     * GenAI exposure
     * Total employment
     * Median annual wage
     * Occupation title / category
     */
    /**
     * GenAI Exposure compared to Total Employment and Wage
     */
    // Scale
    let x = d3
      .scaleLinear()
      .domain([x_min, x_max])
      .range([0 + margin, width - margin]);

    console.log("X Scale: ", x_min, x_max);

    const y_min = d3.min(data, (d) => {
      return +d.total_employment_2024;
    });
    const y_max = d3.max(data, (d) => {
      return +d.total_employment_2024;
    });

    let y = d3
      .scaleLinear()
      .domain([y_min, y_max])
      .range([height - margin, 0 + margin]);

    console.log("Y Scale: ", y_min, y_max);

    let size_scale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) => {
          return +d.median_annual_wage_2024;
        }),
      ])
      .range([0, max_point_size]);

    let opacity_scale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) => {
          return +d.median_annual_wage_2024;
        }),
      ])
      .range([0.1, 0.9]);

    console.log("Scale: ", x, y);

    // Points
    const points = chart
      .append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => {
        return x(d.observed_exposure);
      })
      .attr("cy", (d) => {
        return y(d.total_employment_2024) + y(y_max);
      })
      .attr("r", (d) => {
        return 0;
      })
      .attr("fill", (d) => {
        return `var(--future-vision-danger-color)`;
      })
      .style("stroke-width", "0px");

    points.each(function (d) {
      const duration = size_scale(d.median_annual_wage_2024) * 40;
      const delay = size_scale(d.median_annual_wage_2024) * 40;
      // console.log("duration",duration);
      // console.log("delay",delay);
      d3.select(this)
        .transition()
        .ease(d3.easeBackOut)
        .duration(duration)
        .delay(delay)
        .attr("cx", (d) => {
          return x(d.observed_exposure);
        })
        .attr("cy", (d) => {
          return y(d.total_employment_2024);
        })
        .attr("r", (d) => {
          return size_scale(d.median_annual_wage_2024);
        })
        .attr("fill", (d) => {
          return `color-mix(in srgb, var(--future-vision-primary-color), var(--future-vision-secondary-color) ${(+d.median_annual_wage_2024 /
            d3.max(data, (d) => +d.median_annual_wage_2024)) *
            100}%)`;
        });
    });

    let text = chart
      .append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .text((d) => d.occupation_title)
      .attr("x", (d) => {
        return x(d.observed_exposure);
      })
      .attr("y", (d) => {
        return y(d.total_employment_2024);
      })
      .attr("font-size", (d) => {
        return size_scale(d.median_annual_wage_2024) / 3;
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "rgb(0, 0, 0)");

    remove_accluded_item(text);

    text.each(function (d) {
      const duration = size_scale(d.median_annual_wage_2024) * 40;
      const delay = size_scale(d.median_annual_wage_2024) * 40;

      d3.select(this)
        .attr("font-size", (d) => {
          return size_scale(d.median_annual_wage_2024) / 10;
        })
        .attr("fill", "rgba(255, 255, 255, 0)");

      const x_dest = x(d.observed_exposure);
      const y_dest = y(d.total_employment_2024);

      d3.select(this)
        .transition()
        .ease(d3.easeCircleOut)
        .duration(duration)
        .delay(delay)
        .attr("x", (d) => {
          return x_dest;
        })
        .attr("y", (d) => {
          return y_dest;
        })
        .attr("font-size", (d) => {
          return size_scale(d.median_annual_wage_2024) / 5;
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("fill", "var(--future-vision-text-color)");
    });

    chart
      .append("text")
      .attr("class", "axis-title")
      .attr("x", width - margin - 150)
      .attr("y", height - axis_title_margin)
      .attr("fill", "var(--future-vision-text-color)")
      .text("GenAI Exposure");

    chart
      .append("text")
      .attr("class", "axis-title")
      .attr("x", axis_title_margin)
      .attr("y", margin + 50)
      .attr("fill", "var(--future-vision-text-color)")
      .text("Total Employment");

    // Axies
    chart
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(tick_number)
          .tickSize(-height - 10)
      )
      .call((g) => g.select(".domain").remove())
      .attr("color", "var(--future-vision-secondary-color)")
      .style("opacity", 0.2);

    chart
      .append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(tick_number)
          .tickSize(-width - 10)
      )
      .call((g) => g.select(".domain").remove())
      .attr("color", "var(--future-vision-secondary-color)")
      .style("opacity", 0.2);

    points //let’s attach an event listener to points (all svg circles)
      .on("mouseover", (event, d) => {
        //when mouse is over point
        node_highlight(event);
        summon_tooltip(width, event, d);
      })
      .on("mouseleave", (event) => {
        //when mouse isn’t over point
        node_exit_highlight(event);
      });

    text //let’s attach an event listener to points (all svg circles)
      .on("mouseover", (event, d) => {
        //when mouse is over point
        // node_highlight(event);
        summon_tooltip(width, event, d);
      })
      .on("mouseleave", (event) => {
        //when mouse isn’t over point
        node_exit_highlight(event);
      });
  });
}

function node_exit_highlight(event) {
  d3.select("#scatter-tooltip").style("display", "none"); // hide tooltip
  d3.select(event.currentTarget) //remove the stroke from point
    .style("stroke", "none");
  d3.select(event.currentTarget)
    .transition()
    .duration(200)
    .ease(d3.easeCircleOut)
    .style("stroke", "white")
    .style("stroke-width", "0px");
}

function node_highlight(event) {
  d3.select(event.currentTarget)
    .transition()
    .duration(200)
    .ease(d3.easeCircleOut)
    .style("stroke", "black")
    .style("stroke-width", "2px");
}

function summon_tooltip(svg_width, event, d) {
  let middle_x = svg_width / 2;
  let node_selected_x = event.pageX;

  let left = middle_x < node_selected_x;

  d3
    .select("#scatter-tooltip") // add text inside the tooltip divs
    .style("display", "block") //make it visible
    .style("opacity", "0.1")
    .style("background-color", "var(--future-vision-danger-color)").html(`
            <h1 class="tooltip-title" >${d.occupation_title}</h1>          
            <div>Observed Exposure to AI: ${d.observed_exposure}</div>
            <div>Total Employment: ${d.total_employment_2024}</div>
            <div>Employment Percent Change, 2024-2034: ${d["Employment Percent Change, 2024-2034"]}</div>
            <div>Median Annual Wage: $${d.median_annual_wage_2024}</div>
            `);

  d3.select("#scatter-tooltip")
    .transition()
    .duration(800)
    .ease(d3.easeCircleOut)
    .style("opacity", "1")
    .style("position", "absolute")
    .style("background-color", "var(--future-vision-secondary-color)")
    .style("border", "solid 0px 10px")
    .style("border-radius", "10px")
    .style("padding", "10px")
    .style("top", event.pageY + 10 + "px")
    .style("left", (left ? event.pageX - 220 : event.pageX + 10) + "px");
}
