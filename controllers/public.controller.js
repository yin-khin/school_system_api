const getSite = (req, res) => {
  res.json({
    success: true,
    data: {
      schoolName: process.env.SCHOOL_NAME || "Sokha School",
      motto: process.env.SCHOOL_MOTTO || "Knowledge • Discipline • Future",
      intro:
        process.env.SCHOOL_INTRO ||
        "Providing quality education for a brighter future",
      yearsOfExcellence: process.env.SCHOOL_YEARS || "25+",
      heroImage: process.env.SCHOOL_HERO_IMAGE || null,
    },
  });
};

module.exports = { getSite };
