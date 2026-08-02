#include "NBRApiClient.h"
#include "Json.h"
#include "JsonUtilities.h"

FNBRApiClient::FNBRApiClient(FString InBaseUrl, FString InAuthToken) : BaseUrl(InBaseUrl), AuthToken(InAuthToken){}

void FNBRApiClient::FetchPlayerProfile(TFunction<void(const FNBRPlayerState&)> OnSuccess){
    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();

    Request->SetUrl(BaseUrl + "/players/profile");
    Request->SetVerb("GET");
    Request->SetHeader("Authorization", "Bearer " + AuthToken);
    Request->SetHeader("Content-Type", "application/json");

    Request->OnProcessRequestComplete().BindRaw(this, &FNBRApiClient::OnProfileResponse, OnSuccess);
    Request->ProcessRequest();
}

void FNBRApiClient::OnProfileResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, TFunction<void(const FNBRPlayerState&)> OnSuccess){
    if(bWasSuccessful && Response->GetContentAsString().Len() > 0){

    // Here we will use Unreal's JSON parsser to fill our FNBRPlayerState struct.
    //This effectively "logs the character in" to the 3D lobby.
        UE_LOG(LogTemp, Log, TEXT("NBR PC: Profile Synced Successfully"));
    }
}