#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "NBR_Types.h"
#include "NBR_Character.generated.h"

UCLASS()
class NAMIB_API ANBRCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ANBRCharacter();

    // The current equipped weapon index (0-4)
    UPROPERTY(Replicated, BlueprintReadOnly, Category = "NBR|Inventory")
    int32 ActiveSlot;

    // The visual mesh path from our game-config.json
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NBR|Cosmetics")
    FString EquippedSkinID;

    // Logic for the Fortnite-style fire button
    UFUNCTION(Server, Reliable, BlueprintCallable, Category = "NBR|Combat")
    void ServerRPC_FireWeapon(FVector ShootLocation, FRotator ShootRotation);

    // Logic for the Cyan Over-shield
    UFUNCTION(BlueprintImplementableEvent, Category = "NBR|VFX")
    void OnOvershieldDamaged();

protected:
    virtual void BeginPlay() override;
};