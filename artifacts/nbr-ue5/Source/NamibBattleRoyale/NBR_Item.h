#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "NBR_Types.h"
```cpp
#include "NBR_Item.generated.h"

UCLASS()
class NAMIB_API ANBRItem : public AActor
{
    GENERATED_BODY()

public:
    // Rarity determines the color of the "Glimmer" effect
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NBR|Loot")
    ENBRRarity Rarity;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NBR|Loot")
    FString ItemName;

    // Visual pulse logic
    UFUNCTION(BlueprintNativeEvent, Category = "NBR|Visuals")
    void PlayRarityGlow();

    // Triggered when the player stands in the pickup radius
    UFUNCTION()
    void OnOverlapBegin(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, 
                        UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, 
                        bool bFromSweep, const FHitResult& SweepResult);
};