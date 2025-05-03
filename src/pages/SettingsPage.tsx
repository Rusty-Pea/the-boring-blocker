import React from "react";
import { useApp } from "@/context/AppContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomFilterOptions from "@/components/CustomFilterOptions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const { 
    replacementText, 
    setReplacementText, 
    handleSaveOptions,
    elonOptions,
    trumpOptions,
    customOptions,
    blockImages,
    handleToggleBlockImages,
    handleTogglePersonOption,
    handleAddCustomTerm,
    handleRemoveCustomTerm,
    handleToggleCustomOption,
    handleDeleteHistory,
    voldemortOptions
  } = useApp();
  
  const navigate = useNavigate();
  
  const [localReplacementText, setLocalReplacementText] = React.useState(replacementText);
  
  // Debug console logs
  React.useEffect(() => {
    console.log("Elon options:", elonOptions);
    console.log("Trump options:", trumpOptions);
  }, [elonOptions, trumpOptions]);
  
  const handleSave = () => {
    setReplacementText(localReplacementText);
    handleSaveOptions();
  }
  
  React.useEffect(() => {
    setLocalReplacementText(replacementText);
  }, [replacementText]);
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="elon" className="w-full">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="elon">Musk</TabsTrigger>
          <TabsTrigger value="trump">Trump</TabsTrigger>
          <TabsTrigger value="custom">Your own</TabsTrigger>
          <TabsTrigger value="voldemort">Voldemort</TabsTrigger>
        </TabsList>
        
        <TabsContent value="elon">
          <Card>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-3">
                {elonOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`elon-option-${option.id}`} 
                      checked={option.enabled}
                      onCheckedChange={(checked) => handleTogglePersonOption("elon", option.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`elon-option-${option.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Image blocking</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="block-elon-images" 
                    checked={blockImages}
                    onCheckedChange={(checked) => handleToggleBlockImages(checked as boolean)}
                  />
                  <Label 
                    htmlFor="block-elon-images"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Block images with the above terms in the description
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trump">
          <Card>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-3">
                {trumpOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`trump-option-${option.id}`} 
                      checked={option.enabled}
                      onCheckedChange={(checked) => handleTogglePersonOption("trump", option.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`trump-option-${option.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Image blocking</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="block-trump-images" 
                    checked={blockImages}
                    onCheckedChange={(checked) => handleToggleBlockImages(checked as boolean)}
                  />
                  <Label 
                    htmlFor="block-trump-images"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Block images with the above terms in the description
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardContent className="space-y-6 pt-4">
              <CustomFilterOptions
                customOptions={customOptions}
                blockImages={blockImages}
                onAddTerm={handleAddCustomTerm}
                onRemoveTerm={handleRemoveCustomTerm}
                onToggleOption={handleToggleCustomOption}
                onToggleBlockImages={handleToggleBlockImages}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voldemort">
          <Card>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-3">
                {voldemortOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`voldemort-option-${option.id}`} 
                      checked={option.enabled}
                      onCheckedChange={(checked) => handleTogglePersonOption("voldemort", option.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`voldemort-option-${option.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Image blocking</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="block-voldemort-images" 
                    checked={blockImages}
                    onCheckedChange={(checked) => handleToggleBlockImages(checked as boolean)}
                  />
                  <Label 
                    htmlFor="block-voldemort-images"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Block images with the above terms in the description
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
              Delete History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete History</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your saved settings and custom terms. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHistory} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsPage;
