#include <node.h>
#include <algorithm.cc>

void Calculate(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();

    if (args.Length() != 2) {
        isolate->ThrowException(v8::Exception::TypeError(
            v8::String::NewFromUtf8(
                isolate,
                "This function needs two arguments",
                NewStringType::kNormal
            ).ToLocalChecked();
        ));
        return;
    }

    int ownBR = args[0].As<v8::Number>()->Value(),
    opponentBR = args[1].As<v8::Number>()->Value();

    auto value = v8::Number::New(isolate, calc(ownBR, opponentBR));
    args.GetReturnValue().Set(v8::Num);
}

void Init(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "calc", Calculate);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init);