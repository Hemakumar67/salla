var base64 = require('base-64');

exports = {
  events: [
    { event: "onAppInstall", callback: "onAppInstallCallback" },
    { event: "onAppUninstall", callback: "onAppUninstallCallback" },
    { event: "onExternalEvent", callback: "onExternalEventCallback" }
  ],
  onAppInstallCallback: function (payload) {
    console.log("Logging arguments from onAppInstallevent : " + JSON.stringify(payload));
    generateTargetUrl()
      .then(function (url) {
        console.info("Generated Webhook URL : " + url);
        renderData();
        // let webhook_url = url

        var headers = {
          'Authorization': 'Bearer enter salla api',
          'Content-Type': 'application/json'
        };
        var options = { headers: headers };
        options["body"] = JSON.stringify({
          "name": "feshdesk register",
          "event": "order.created",
          "url": "https://hooks4.freshworks.com/dvuJiyGlPRcI4AjfekO7OHAXJ002TfeiaDyXr3UWnZG9yXMwToaTsUYiGWt8pFKL",
          "headers": [
            {
              "key": "Authorization",
              "value": "enter salla api"
            }, {
              "key": "Accept-Language",
              "value": "AR"
            }
          ]
        })
        console.log(options, "options")
        $request.post(`https://api.salla.dev/admin/v2/webhooks/subscribe`, options)
          .then(function (data) {
            console.log(data.response, "webhook register success")
            let detail = JSON.parse(data.response)
            console.log(typeof (detail), "detail")
            console.log(detail.data.id, "parse data")
            // let id = {}
            // id.u_id = detail.data.id
            // console.log(id.u_id,"id.u_id")
            let obj = { "webhookURL": "https://hooks4.freshworks.com/dvuJiyGlPRcI4AjfekO7OHAXJ002TfeiaDyXr3UWnZG9yXMwToaTsUYiGWt8pFKL" }
            $db.set("webhookURL", obj).then(
              function (datas) {
                console.log(datas, "datas")
                // success operation
                // "data" value is { "Created" : true }
              },
              function (error) {
                // failure operation
                console.log(error, "errorsssss")
              });
          },
            function (error) {
              console.log("error")
              console.log(error)
            })
      })
      .fail(function (err) {
        console.error(err);
        renderData({ message: "Generating Webhook URL failed" });
      });
  },

  onExternalEventCallback: function (payload) {
    console.log("Logging arguments from onExternalEvent: " + JSON.stringify(payload));
    let domain_name = payload.iparams.domainName
    //let apikey = payload.iparams.apiKey
    console.log(domain_name)
    console.log("payload", payload.data)
    console.log("customer", payload.data.customer)
    console.log("customer.email", payload.data.customer.email)
    console.log("mobile", payload.data.customer.mobile)
    var mobilenumber = payload.data.customer.mobile
    var name = payload.data.customer.first_name;
    let c_id = payload.data.customer.id
    let email = payload.data.customer.email
    console.log("name", name, "email", email)
    var headers = {
      "Authorization": `Basic ${base64.encode(payload.iparams.apiKey)}`,
      'Content-Type': 'application/json'
    };
    var options = { headers: headers };

    var urls = (email !== "") ? `https://${domain_name}.freshdesk.com/api/v2/search/contacts?query="email:'${email}'"` : `https://${domain_name}.freshdesk.com/api/v2/search/contacts?query="mobile:${mobilenumber}"`
    console.log("urls", urls)
    $request.get(urls, options).then(function (data) {
      console.log("data", JSON.parse(data.response))
      let total = JSON.parse(data.response).total
      if (total == 0) {
        console.log("empty con")
        options["body"] = JSON.stringify({
          "name": name,
          "email": email ? email : mobilenumber.toString()+"@gmail.com",
          "mobile": mobilenumber.toString(),
          "unique_external_id": c_id.toString()
        })
        // options.method = "POST"
        console.log("contact")
        console.log(options, "options")
        $request.post(`https://${domain_name}.freshdesk.com/api/v2/contacts`, options)
          .then(function (data) {
            console.log("contact created", data)
            let con_details = JSON.parse(data.response)
            console.log(con_details, "con_details")
            console.log(con_details.mobile, "con_details.mobile")
            console.log(con_details.email, "con_details.email")
            console.log(con_details.unique_external_id,"con_details.unique_external_id")
            console.log(con_details.id,"con_details.id")

            let obj_details = {
              "email":con_details.email,
              "mobile":con_details.mobile,
              "customer_id":con_details.unique_external_id,
              "freshdesk_id":con_details.id
            }

            $db.set(con_details.mobile.toString(), obj_details).then(
              function (datas) {
                console.log(datas, "datas")
                // success operation
                // "data" value is { "Created" : true }
              },
              function (error) {
                // failure operation
                console.log(error, "errorsssss")
              });
          },
            function (e) {
              console.log("error in contact creation", e)
            })
      } else {
        console.log("some data here")
      }
    }, function (e) {
      console.log(e, "errror in search api")
    }
    )
    //contct search

  },

  onAppUninstallCallback: function (payload) {
    console.log(payload, "payload")
    $db.get("webhookURL").then(data => {
      console.log("data", data.webhookURL)
      var headers = {
        'Authorization': 'Bearer enter salla api',
        'Content-Type': 'application/json'
      };
      var options = { headers: headers };
      options["body"] = JSON.stringify({
        "url": data.webhookURL,
        "headers": [
          {
            "key": "Authorization",
            "value": "enter salla api"
          }
        ]
      })
      $request.delete(`https://api.salla.dev/admin/v2/webhooks/unsubscribe`, options)
        .then(function (data) {
          console.log(data.response, "webhook deleted success")
        },
          function (error) {
            console.log("error")
            console.log(error)
          })
    },
      function (e) {
        console.log("error", e)
      })
    console.log("Logging arguments from onAppUninstall event: " + JSON.stringify(payload));
    renderData();

  }
}