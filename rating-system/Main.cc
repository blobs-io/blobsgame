#include <node.h>
#include <algorithm.cc>

void Calculate(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();

    int ownBR = args[0].As<v8::Number>()->Value(),
    opponentBR = args[1].As<v8::Number>()->Value();

    v8::Local<v8::Number> value = v8::Number::New(isolate, calc(ownBR, opponentBR));
    args.GetReturnValue().Set(value);
}

void Init(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "calc", Calculate);
}

NODE_MODULE(addon, Init);