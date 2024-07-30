// ============================================================================
// Frankus Ping Tool
// Programmed by Francois Lamini
// ============================================================================

let http = require("http");
let url = require("url");
let frankus = require("./Backend");

// *****************************************************************************
// Ping Implementation
// *****************************************************************************

class cPing extends frankus.cNerd {

  /**
   * Creates a new Ping interface.
   */
  constructor() {
    super();
    this.pairs = [];
  }
  
  On_Interpret(op, params) {
    let status = "";
    if (op == "ping") {
      let server = this.Get_Param(params, "Server URL not specified.");
      let content_type = this.Get_Param(params, "Content type not specified.");
      let method = this.Get_Param(params, "Method not specified.");
      let component = this;
      this.Ping(server, content_type, method, function() {
        component.command_ctrl.prompt();
      });
    }
    else if (op == "add") {
      let name = this.Get_Param(params, "Name missing.");
      let value = this.Get_Param(params, "Value missing.");
      this.pairs.push([ name, value.replace(/\\s/g, " ") ]); // Replace escaped space.
      this.command_ctrl.prompt();
    }
    else if (op == "delete") {
      if (this.pairs.length > 0) {
        this.pairs.pop();
      }
      this.command_ctrl.prompt();
    }
    else if (op == "clear") {
      this.pairs = [];
      this.command_ctrl.prompt();
    }
    else if (op == "print") {
      let pair_count = this.pairs.length;
      for (let pair_index = 0; pair_index < pair_count; pair_index++) {
        let pair = this.pairs[pair_index];
        console.log(pair[0] + "=" + pair[1]);
      }
      this.command_ctrl.prompt();
    }
    else {
      status = "error";
    }
    return status;
  }
  
  /**
   * Pings a server. Prints the output.
   * @param server The server path to ping.
   * @param content_type The content-type for the output.
   * @param method The request method.
   * @param on_ouput Called when the contents of request are outputted.
   */
  Ping(server, content_type, method, on_output) {
    let path = new url.URL(server);
    if (method == "GET") {
      http.get(server + "?" + this.Encode_Data("text"), function(response) {
        let status = response.statusCode;
        console.log("Status: " + status);
        console.log("Content-Type: " + content_type);
        response.setEncoding("utf8");
        let chunk_str = "";
        response.on("data", function(chunk) {
          chunk_str += (chunk);
        });
        response.on("end", function() {
          console.log("--- data ---");
          if (content_type.match(/json/)) {
            console.dir(JSON.parse(chunk_str));
          }
          else {
            console.log(chunk_str);
          }
          on_output();
        });
      });
    }
    else if (method == "POST") {
      let post_data = "";
      if (content_type.match(/json/)) {
        post_data = this.Encode_Data("json");
      }
      else {
        post_data = this.Encode_Data("text");
      }
      let options = {
        hostname: path.hostname,
        port: path.port,
        path: path.pathname,
        method: method,
        headers: {
          "Content-Type": content_type,
          "Content-Length": Buffer.byteLength(post_data)
        }
      };
      let request = http.request(options, function(response) {
        let status = response.statusCode;
        console.log("Status: " + status);
        console.log("Content-Type: " + response.headers["content-type"]);
        response.setEncoding("utf8");
        let chunk_str = "";
        response.on("data", function(chunk) {
          chunk_str += chunk;
        });
        response.on("end", function() {
          console.log("--- data ---");
          if (response.headers["content-type"].match(/json/)) {
            console.dir(JSON.parse(chunk_str));
          }
          else {
            console.log(chunk_str);
          }
          on_output();
        });
      });
      request.on("error", function(error) {
        console.log(error.message);
        on_ouput();
      });
      request.write(post_data);
      request.end();
    }
  }
  
  /**
   * Encodes data into a query string or post data.
   * @param type The type of data to encode.
   * @return The encoded data.
   */
  Encode_Data(type) {
    let pair_count = this.pairs.length;
    let encoded_pairs = [];
    for (let pair_index = 0; pair_index < pair_count; pair_index++) {
      let pair = this.pairs[pair_index];
      let name = (type == "json") ? '"' + pair[0] + '"' : pair[0];
      let value = (type == "json") ? '"' + pair[1] + '"' : encodeURIComponent(pair[1]);
      if (type == "json") {
        encoded_pairs.push(name + ": " + value);
      }
      else {
        encoded_pairs.push(name + "=" + value);
      }
    }
    let encoded_data = (type == "json") ? JSON.stringify(JSON.parse("{ " + encoded_pairs.join(", ") + " }")) : encoded_pairs.join("&");
    return encoded_data;
  }

}

// *****************************************************************************
// Entry Point
// *****************************************************************************
let ping = new cPing();
ping.Run();