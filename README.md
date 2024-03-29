# Spark iOS SDK
The Spark iOS SDK enables you to run your WASM models on the iOS platform.

## Getting started
The SDK is available as a Swift package and can be added to an Xcode project via Swift Package Manager.

## Demo application
The demo app is available [here](https://github.com/Coherent-Partners/Spark-iOS-SDK-Demo)

## Installation

### Requirements
Spark iOS SDK requires **version 13.4** or later of [Xcode](https://developer.apple.com/xcode/) to run the project.
Minimum iOS target is **iOS 14.0**.

### Installation through Swift Package Manager
The Swift Package Manager is a tool for automating the distribution of Swift code or binary frameworks and is integrated into the swift compiler. Spark iOS SDK does support its use on supported platforms.

Adding Spark iOS SDK as a dependency is as easy as adding it to the dependencies value of your `Package.swift`.

```
dependencies: [
    .package(url: "https://github.com/Coherent-Partners/Spark-iOS-swift-sdk.git", .upToNextMajor(from: "1.0.3"))
]

```

### Including WASM models
The SDK does not contain any WASM models by default; these must be provided to the factory.

To do this, use the Impex command line tool to obtain the models as a zip file. Unzip this and add the files to your Xcode project. Each model ID must be present as either a zip file (eg. `39eb9fb4-3343-475c-8511-1f862ba2d408.zip`) *OR* an unzipped directory with the same ID. The calculations perform better with unzipped models. It's an error to have a zip file and a directory with the same model ID - the SDK won't be able to deal with this. If there is any directory with the same model ID as a zip file, requesting the SDK will fail.


## Creating an instance of the SDK

### Create the SDK factory

```
   let factory = SparkSDKFactory()
```
The SDK will use an instance of `WKWebView` to host the WASM models. In the above example, the SDK factory will create the instance itself. It's also possible to pass in an instance of a web view, eg. if you have already attached it to the UI hierarchy.
```
    let webView = WKWebView(frame: .zero)
    let factory = SparkSDKFactory(webView: webView)
    
    // attach web view to UI elsewhere in class
```

### Attaching the `WKWebView` to the view hierarchy
As of version 1.1, for performance reasons, you must ensure that the `WKWebView` instance is attached to your app's view hierarchy. This can be done after creating the factory, but must be done *before* making the call to `requestSDK`. This is so the SDK initialization benefits from `WKWebView`'s improved performance. The SDK will fail to initialize if the `WKWebView` is not attached to the view hierarchy.

### Requesting the SDK from the factory 
Given that your WASM models have been added to your project, you should obtain the directory where the models are stored, as a string. For example, this code gets the location of an folder in the project called `models`.
```
   let path = Bundle.main.bundlePath
   let modelsPath = "\(path)/models"
```

Then, pass this string to the factory, along with a completion handler. The factory has to do some setup work behind the scenes. We're using a completion handler here so we don't block the calling function. When everything is ready, or has failed, the completion handler will be called with a `Result<SparkSDK, Error>` value. The completion handler will always be called - if setup failed, the result will be an error, with some information on what went wrong. 

As of version 1.1, if the factory's `WKWebView` is not attached to the view hierarchy at this point, the completion handler will be called with an `Error`.

If setup succeeded, your `Result` will contain a `SparkSDK` instance.
```
    let modelsUrl = URL(fileURLWithPath: modelsPath)
    factory.requestSDK(
        modelsPath: modelsUrl.absoluteString,
        onSDKReady: { sdkResult in
            // handle sdkResult here
        }
    )
```

## Logging
As of version 1.0.6, the SDK has logging disabled by default. To re-enable this, pass `enableLogging: true`
```
    let modelsUrl = URL(fileURLWithPath: modelsPath)
    factory.requestSDK(
        modelsPath: modelsUrl.absoluteString,
        enableLogging: true,
        onSDKReady: { sdkResult in
            // handle sdkResult here
        }
    )
```

## Using the SDK to process data
Once an instance of the SDK is created, you are ready to pass data to it, for execution. The data will be processed by the models that were loaded when creating the SDK instance.
The interface presented by the SDK for executing a model request intentionally resembles the web equivalent.
To pass data to the SDK, you will need to provide two things:
- The data itself, defined as a dictionary of `String, Any`. This must include your inputs, and your request metadata, similar to the web version. The SDK will convert this to JSON, so it must contain only types that can be represented as JSON.
- A request ID, which can be any unique `String`. We recommend using a UUID for this. The request ID will be included with the response.

#### Observing data results
The SDK exposes a `Publisher` called `executionResponses` which will contain the results of all data execution requests. It's recommended to start observing this publisher as early as possible, once the SDK instance has been created. It will publish instances of `Result<ExecutionResponse, Error>`. When a data execution request fails, an error result will be published. When a data execution request succeeds, a success result will be published, containing an `ExecutionResponse`. This `ExecutionResponse` will contain the request ID along with the response data generated by the models. 

```
    resultCancellable = sparkSDK?.$executionResponses.sink(receiveValue: { value in
        print("Result response:  \(value)")
        switch value {
            case .success(let executionReult):
                /* Get the requestId and result value */
                // executionReult.requestId
                // executionReult.result
            case .failure(let error):
                //error handling
        }
    })
```

#### Executing a data request
Typically, the data request JSON will have this structure:
```
{
    "request_data": {
        "inputs": {
            // More inputs can be added in this object
            "Input": 1
        }
    },
    "request_meta": {
        "version_id": "0211e8f0-9988-4514-a761-9782db6700ce",
        "call_purpose": "Spark - API Tester",
        "source_system": "SPARK",
        "correlation_id": "",
        "requested_output": null,
        "service_category": ""
    }
}
```

Your input data must match this structure when encoded as JSON. You will also need a request ID, which is required to be unique. A result for a specific request will use this request ID. 

Passing the data to the SDK, along with the request ID, looks like this.
```
    let requestId = UUID().uuidString
    sparkSDK.execute(requestId: requestId, input: inputData)
```
The `execute` call will complete without returning a value, because the execution responses are published via the publisher.
