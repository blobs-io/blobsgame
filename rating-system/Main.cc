#include <node.h>
#include <algorithm.cc>

void Calculate(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();

    if (args.Length() != 2) {
        isolate->ThrowException(
            v8::Exception::TypeError(
                v8::String::NewFromUtf8(isolate, "Invalid number of arguments. Required: 2", v8::NewStringType::kNormal).ToLocalChecked()
            )
        );
    }

    if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
        isolate->ThrowException(
            v8::Exception::TypeError(
                v8::String::NewFromUtf8(isolate, "Both arguments have to be numbers", v8::NewStringType::kNormal).ToLocalChecked()
                )
            );
        return;
    }
    int ownBR = args[0].As<v8::Number>()->Value(),
    opponentBR = args[1].As<v8::Number>()->Value();

    v8::Local<v8::Number> value = v8::Number::New(isolate, calc(ownBR, opponentBR));
    args.GetReturnValue().Set(value);
}

void Init(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "calc", Calculate);
}

NODE_MODULE(addon, Init);