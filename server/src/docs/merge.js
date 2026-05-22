import fs from "fs";
import YAML from "yamljs";
import yaml from "js-yaml";

const base = YAML.load("./swagger.yaml");
const user = YAML.load("./user.yaml");

const merged = {
  ...base,
  paths: {
    ...(base.paths || {}),
    ...(user.paths || {}),
  },
  components: {
    ...(base.components || {}),
    schemas: {
      ...(base.components?.schemas || {}),
      ...(user.components?.schemas || {}),
    },
  },
};

fs.writeFileSync("./swagger.merged.yaml", yaml.dump(merged, { noRefs: true }));
console.log("swagger.merged.yaml created");