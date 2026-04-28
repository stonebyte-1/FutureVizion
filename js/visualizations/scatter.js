
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
