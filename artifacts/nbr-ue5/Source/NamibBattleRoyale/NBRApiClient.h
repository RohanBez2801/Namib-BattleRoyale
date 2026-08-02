#pragma

#include "CoreMinimal.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "NBR_Types.h"

class FNBRApiClient {
    public:
        FNBRApiClient(FString InBaseUrl, FString InAuthToken);

        //Replicates the "Lobby" sync logic from the Mobile app
        void FetchPlayerProfile(TFunction<void(const FNBRPlayerState&)> OnSuccess);

        //Replicates the "Play Now" logic
        void RequestMatchEntry(FString MatchMode, TFunction<void(FString ServerIP)> OnFound);
    
    private:
        FString BaseUrl;
        FString AuthToken;

        void OnProfileResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, TFunction<void(const FNBRPlayerState&)> OnSuccess);
};