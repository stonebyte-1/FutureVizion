import * as d3 from "d3";
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


function bounding_boxes_overlap(box1, box2) {
    return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
    );  
}

d3.csv("./data/all_careers.csv").then((data)=>{
    const svg = d3.select("#scatter-plot");
    
    console.log(data);
    const width = svg.attr("width");
    const height = svg.attr("height");
    const max_point_size = 60;
    console.log(width,height);

    console.log(data[0]);
    
    const chart = svg.append("g")

    const x_min = d3.min(data, d => { return +d.observed_exposure; });
    const x_max = d3.max(data, d => { return +d.observed_exposure; });
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

    let x = d3.scaleLinear()
    .domain([x_min,x_max])
    .range([0,width]);

    console.log("X Scale: ",x_min,x_max);
    

    const y_min = d3.min(data, d => { return +d.total_employment_2024; });
    const y_max = d3.max(data, d => { return +d.total_employment_2024; });
    
    let y = d3.scaleLinear()
    .domain([y_min,y_max])
    .range([height,0])

    console.log("Y Scale: ",y_min,y_max);
    

    let size_scale = d3.scaleLinear()
    .domain([0,d3.max(data,d=>{return +d.median_annual_wage_2024})])
    .range([0,max_point_size])

    let opacity_scale = d3.scaleLinear()
    .domain([0,d3.max(data,d=>{return +d.median_annual_wage_2024})])
    .range([0.10,1])

    console.log("Scale: ",x,y);
    
    // Points
    
    const points = chart.append('g')
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx',(d)=>{return x(d.observed_exposure)})
    .attr('cy',(d)=>{return y(d.total_employment_2024)})
    .attr('r',(d)=>{return 0})
    .attr('fill',(d)=>{return `rgb(255, 255, 255)`});
    

    points.each(function(d){
        const duration = size_scale(d.median_annual_wage_2024)*40;
        const delay = size_scale(d.median_annual_wage_2024)*40;
        // console.log("duration",duration);
        // console.log("delay",delay);

        
        d3.select(this)
        .transition()
        .ease(d3.easeBackOut)
        .duration(duration)
        .delay(delay)
        .attr("r",(d)=>{
            return size_scale(d.median_annual_wage_2024)})
        .attr('fill',(d)=>{return `rgba(112, 112, 112, ${opacity_scale(d.median_annual_wage_2024)})`});
    
    });

    let text = chart.append('g')
    .selectAll('text')
    .data(data)
    .join('text')
    .text(d=>d.occupation_title)
    .attr('x',(d)=>{return x(d.observed_exposure)})
    .attr('y',(d)=>{return y(d.total_employment_2024)})
    .attr('font-size',(d)=>{
        return size_scale(d.median_annual_wage_2024)/3
    })
    .attr('text-anchor',"middle")
    .attr('alignment-baseline',"middle")
    .attr('fill',"rgb(0, 0, 0)");

    text.each(function(d){
        let text_bounding_box = this.getBBox();
        text.each(function(d2){
            let text2_bounding_box = this.getBBox();
            if(bounding_boxes_overlap(text_bounding_box,text2_bounding_box) && d != d2){
                this.remove();
            }
        })
    });

    text.each(function(d){
        const duration = size_scale(d.median_annual_wage_2024)*40;
        const delay = size_scale(d.median_annual_wage_2024)*40;
        
        d3.select(this)
        .attr('font-size',(d)=>{
            return size_scale(d.median_annual_wage_2024)/10
        })
        .attr("fill","rgba(255, 255, 255, 0)")
        
        d3.select(this)
        .transition()
        .ease(d3.easeCircleOut)
        .duration(duration)
        .delay(delay)
        .attr('x',(d)=>{return x(d.observed_exposure)})
        .attr('y',(d)=>{return y(d.total_employment_2024)})
        .attr('font-size',(d)=>{
            return size_scale(d.median_annual_wage_2024)/5
        })
        .attr('text-anchor',"middle")
        .attr('alignment-baseline',"middle")
        .attr('fill',"rgb(0, 0, 0)");
        

    
    });

    
})
