declare const CreateDataset: {
    readonly body: {
        readonly properties: {
            readonly name: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The name of the dataset.";
            };
            readonly description: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "A description for the dataset.";
            };
        };
        readonly required: readonly ["name"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly insert_datasets_one: {
                    readonly description: "columns and relationships of \"datasets\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "datasets";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateElement: {
    readonly body: {
        readonly properties: {
            readonly name: {
                readonly default: "placeholder";
                readonly title: "String";
                readonly type: "string";
                readonly description: "The name of the element.";
            };
            readonly description: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The description of the element.";
            };
            readonly datasetId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the dataset to train the element on.";
            };
            readonly instance_prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Use a word that is closely related to what you're training that isn't too common. For example, instead of 'dog,' try something unique like 'jackthedog' or 'magicdonut'. Required for all non-FLUX_DEV models and FLUX_DEV Character model training.";
            };
            readonly lora_focus: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The category determines how the element will be trained. Options are 'General' | 'Character' | 'Style' | 'Object'. FLUX_DEV doesn't support General category.";
            };
            readonly train_text_encoder: {
                readonly default: true;
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether or not encode the train text.";
            };
            readonly resolution: {
                readonly default: 1024;
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The resolution for training. Must be 1024.";
            };
            readonly sd_version: {
                readonly default: "FLUX_DEV";
                readonly title: "sd_versions";
                readonly enum: readonly ["SDXL_0_9", "SDXL_1_0", "LEONARDO_DIFFUSION_XL", "LEONARDO_LIGHTNING_XL", "VISION_XL", "KINO_XL", "ALBEDO_XL", "FLUX_DEV"];
                readonly description: "The base version to use if not using a custom model.";
            };
            readonly num_train_epochs: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of times the entire training dataset is passed through the element.<br><br><table><tr><th>Model Type</th><th>Lora Focus</th><th>Min</th><th>Max</th><th>Default</th></tr><tr><td>Default</td><td>General | Style | Character | Object</td><td>1</td><td>250</td><td>100</td></tr><tr><td rowspan='3'>FLUX_DEV</td><td>Style</td><td>30</td><td>120</td><td>60</td></tr><tr><td>Object</td><td>120</td><td>220</td><td>140</td></tr><tr><td>Character</td><td>100</td><td>200</td><td>135</td></tr><tr><td>General</td><td colspan='3'>NA</td></tr></table>";
            };
            readonly learning_rate: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "The speed at which the model learns during training.<br><br><table><tr><th>Model Type</th><th>Lora Focus</th><th>Min</th><th>Max</th><th>Default</th></tr><tr><td>Default</td><td>General | Style | Character | Object</td><td>0.00000001</td><td>0.00001</td><td>0.000001</td></tr><tr><td rowspan='3'>FLUX_DEV</td><td>Style</td><td>0.000001</td><td>0.00003</td><td>0.00001</td></tr><tr><td>Object</td><td>0.00001</td><td>0.001</td><td>0.0004</td></tr><tr><td>Character</td><td>0.00001</td><td>0.001</td><td>0.0005</td></tr><tr><td>General</td><td colspan='3'>NA</td></tr></table>";
            };
        };
        readonly required: readonly ["name", "datasetId", "lora_focus", "sd_version", "learning_rate", "num_train_epochs", "train_text_encoder"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly sdTrainingJob: {
                    readonly properties: {
                        readonly userLoraId: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Model Training. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDTrainingOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateGeneration: {
    readonly body: {
        readonly properties: {
            readonly alchemy: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use Alchemy. Note: The appropriate Alchemy version is selected for the specified model. For example, XL models will use Alchemy V2.";
                readonly default: true;
            };
            readonly contrastRatio: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Contrast Ratio to use with Alchemy. Must be a float between 0 and 1 inclusive.";
            };
            readonly contrast: {
                readonly type: "number";
                readonly description: "Adjusts the contrast level of the generated image. Used in Phoenix and Flux models. Accepts values [1.0, 1.3, 1.8, 2.5, 3, 3.5, 4, 4.5]. For Phoenix, if alchemy is true, contrast needs to be 2.5 or higher.";
                readonly minimum: 1;
                readonly maximum: 4.5;
                readonly title: "Float";
                readonly examples: readonly [3.5];
            };
            readonly controlnets: {
                readonly items: {
                    readonly properties: {
                        readonly initImageId: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "The ID of the init image";
                        };
                        readonly initImageType: {
                            readonly type: "string";
                            readonly enum: readonly ["GENERATED", "UPLOADED"];
                            readonly description: "Type indicating whether the init image is uploaded or generated.";
                        };
                        readonly preprocessorId: {
                            readonly title: "numeric";
                            readonly type: "number";
                            readonly description: "ID of the controlnet. A list of compatible IDs can be found in our guides.";
                        };
                        readonly weight: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly description: "Weight for the controlnet";
                        };
                        readonly strengthType: {
                            readonly type: "string";
                            readonly enum: readonly ["Low", "Mid", "High", "Ultra", "Max"];
                            readonly description: "Strength type for the controlnet. Can only be used for Style, Character and Content Reference controlnets.";
                        };
                    };
                    readonly title: "controlnet_input";
                    readonly type: "object";
                };
                readonly type: "array";
            };
            readonly elements: {
                readonly items: {
                    readonly properties: {
                        readonly akUUID: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "Unique identifier for element. Elements can be found from the List Elements endpoint.";
                        };
                        readonly weight: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly default: 1;
                            readonly description: "Weight for the element";
                        };
                    };
                    readonly required: readonly ["akUUID"];
                    readonly title: "element_input";
                    readonly type: "object";
                };
                readonly type: "array";
            };
            readonly userElements: {
                readonly items: {
                    readonly properties: {
                        readonly userLoraId: {
                            readonly title: "Int";
                            readonly type: "number";
                            readonly description: "Unique identifier for user custom element.";
                        };
                        readonly weight: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly description: "Weight for the element";
                        };
                    };
                    readonly title: "user_elements_input";
                    readonly type: "object";
                };
                readonly type: "array";
            };
            readonly expandedDomain: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use the Expanded Domain feature of Alchemy.";
            };
            readonly fantasyAvatar: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use the Fantasy Avatar feature.";
            };
            readonly guidance_scale: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "How strongly the generation should reflect the prompt. 7 is recommended. Must be between 1 and 20.";
            };
            readonly height: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The input height of the images. Must be between 32 and 1536 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features.";
                readonly default: 768;
            };
            readonly highContrast: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use the High Contrast feature of Prompt Magic. Note: Controls RAW mode. Set to false to enable RAW mode.";
            };
            readonly highResolution: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use the High Resolution feature of Prompt Magic.";
            };
            readonly imagePrompts: {
                readonly items: {
                    readonly title: "String";
                    readonly type: "string";
                };
                readonly type: "array";
            };
            readonly imagePromptWeight: {
                readonly title: "Float";
                readonly type: "number";
            };
            readonly init_generation_image_id: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of an existing image to use in image2image.";
            };
            readonly init_image_id: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of an Init Image to use in image2image.";
            };
            readonly init_strength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How strongly the generated images should reflect the original image in image2image. Must be a float between 0.1 and 0.9.";
            };
            readonly modelId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The model ID used for image generation. If not provided, uses sd_version to determine the version of Stable Diffusion to use. In-app, model IDs are under the Finetune Models menu. Click on the platform model or your custom model, then click View More. For platform models, you can also use the List Platform Models API.";
                readonly default: "b24e16ff-06e3-43eb-8d33-4416c2d75876";
            };
            readonly negative_prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The negative prompt used for the image generation";
            };
            readonly num_images: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of images to generate. Must be between 1 and 8. If either width or height is over 768, must be between 1 and 4.";
                readonly default: 4;
            };
            readonly num_inference_steps: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The Step Count to use for the generation. Must be between 10 and 60. Default is 15.";
            };
            readonly photoReal: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable the photoReal feature. Requires enabling alchemy and unspecifying modelId (for photoRealVersion V1).";
            };
            readonly photoRealVersion: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The version of photoReal to use. Must be v1 or v2.";
            };
            readonly photoRealStrength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Depth of field of photoReal. Must be 0.55 for low, 0.5 for medium, or 0.45 for high. Defaults to 0.55 if not specified.";
            };
            readonly presetStyle: {
                readonly type: "string";
                readonly title: "sd_generation_style";
                readonly enum: readonly ["ANIME", "BOKEH", "CINEMATIC", "CINEMATIC_CLOSEUP", "CREATIVE", "DYNAMIC", "ENVIRONMENT", "FASHION", "FILM", "FOOD", "GENERAL", "HDR", "ILLUSTRATION", "LEONARDO", "LONG_EXPOSURE", "MACRO", "MINIMALISTIC", "MONOCHROME", "MOODY", "NONE", "NEUTRAL", "PHOTOGRAPHY", "PORTRAIT", "RAYTRACED", "RENDER_3D", "RETRO", "SKETCH_BW", "SKETCH_COLOR", "STOCK_PHOTO", "VIBRANT", "UNPROCESSED"];
                readonly description: "The style to generate images with. When photoReal is enabled, refer to the Guide section for a full list. When alchemy is disabled, use LEONARDO or NONE. When alchemy is enabled, use ANIME, CREATIVE, DYNAMIC, ENVIRONMENT, GENERAL, ILLUSTRATION, PHOTOGRAPHY, RAYTRACED, RENDER_3D, SKETCH_BW, SKETCH_COLOR, or NONE.";
                readonly default: "DYNAMIC";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate images";
                readonly default: "A majestic cat in the snow";
            };
            readonly promptMagic: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use Prompt Magic.";
            };
            readonly promptMagicStrength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Strength of prompt magic. Must be a float between 0.1 and 1.0";
            };
            readonly promptMagicVersion: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Prompt magic version v2 or v3, for use when promptMagic: true";
            };
            readonly public: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generated images should show in the community feed.";
            };
            readonly scheduler: {
                readonly type: "string";
                readonly title: "sd_generation_schedulers";
                readonly enum: readonly ["KLMS", "EULER_ANCESTRAL_DISCRETE", "EULER_DISCRETE", "DDIM", "DPM_SOLVER", "PNDM", "LEONARDO"];
                readonly description: "The scheduler to generate images with. Defaults to EULER_DISCRETE if not specified.";
            };
            readonly sd_version: {
                readonly type: "string";
                readonly title: "sd_versions";
                readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models";
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
            readonly tiling: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generated images should tile on all axis.";
            };
            readonly transparency: {
                readonly title: "TransparencyType";
                readonly type: "string";
                readonly enum: readonly ["disabled", "foreground_only"];
                readonly description: "Which type of transparency this image should use";
            };
            readonly ultra: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Enable to use Ultra mode. Note: can not be used with Alchemy.";
            };
            readonly unzoom: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generated images should be unzoomed (requires unzoomAmount and init_image_id to be set).";
            };
            readonly unzoomAmount: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How much the image should be unzoomed (requires an init_image_id and unzoom to be set to true).";
            };
            readonly upscaleRatio: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How much the image should be upscaled. (Enterprise Only)";
            };
            readonly width: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The input width of the images. Must be between 32 and 1536 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features.";
                readonly default: 1024;
            };
            readonly controlNet: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "This parameter will be deprecated in September 2024. Please use the controlnets array instead.";
                readonly deprecated: true;
            };
            readonly controlNetType: {
                readonly deprecated: true;
                readonly type: "string";
                readonly title: "controlnet_type";
                readonly enum: readonly ["POSE", "CANNY", "DEPTH"];
                readonly description: "This parameter will be deprecated in September 2024. Please use the controlnets array instead.";
            };
            readonly weighting: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "This parameter will be deprecated in September 2024. Please use the controlnets array instead.";
                readonly deprecated: true;
            };
            readonly canvasRequest: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generation is for the Canvas Editor feature.";
            };
            readonly canvasRequestType: {
                readonly type: "string";
                readonly title: "canvasRequestType";
                readonly enum: readonly ["INPAINT", "OUTPAINT", "SKETCH2IMG", "IMG2IMG"];
                readonly description: "The type of request for the Canvas Editor.";
            };
            readonly canvasInitId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of an initial image to use in Canvas Editor request.";
            };
            readonly canvasMaskId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of a mask image to use in Canvas Editor request.";
            };
            readonly enhancePrompt: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "When enabled, your prompt is expanded to include more detail.";
            };
            readonly enhancePromptInstruction: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "When enhancePrompt is enabled, the prompt is enhanced based on the given instructions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly sdGenerationJob: {
                    readonly properties: {
                        readonly generationId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Image Generation. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateImageToVideoGeneration: {
    readonly body: {
        readonly properties: {
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate video";
            };
            readonly imageId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the image, supports generated images and init images. Use only image or imageId with imageType.";
            };
            readonly imageType: {
                readonly type: "string";
                readonly enum: readonly ["GENERATED", "UPLOADED"];
                readonly description: "Type indicating whether the init image is uploaded or generated. Use only image or imageId with imageType.";
            };
            readonly endFrameImage: {
                readonly title: "Object";
                readonly type: "object";
                readonly description: "The end frame image. Supported only on kling2_1 model when used in conjunction with an init image.";
                readonly properties: {
                    readonly id: {
                        readonly title: "String";
                        readonly type: "string";
                        readonly description: "The ID of the end frame image.";
                    };
                    readonly type: {
                        readonly title: "String";
                        readonly type: "string";
                        readonly enum: readonly ["GENERATED", "UPLOADED"];
                        readonly description: "Type indicating whether the end frame image is uploaded or generated.";
                    };
                };
                readonly required: readonly ["id", "type"];
            };
            readonly resolution: {
                readonly title: "String";
                readonly enum: readonly ["RESOLUTION_480", "RESOLUTION_720", "RESOLUTION_1080"];
                readonly description: "The resolution of the output video. Acceptable values vary based on model";
            };
            readonly model: {
                readonly title: "String";
                readonly enum: readonly ["MOTION2", "VEO3", "MOTION2FAST", "VEO3FAST", "KLING2_1", "KLING2_5"];
                readonly description: "The model to use for the video generation. Defaults to MOTION2 if not specified.";
                readonly default: "MOTION2";
            };
            readonly frameInterpolation: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Smoothly blend frames for fluid video transitions using Interpolation.";
            };
            readonly isPublic: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generation is public or not";
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Motion 2.0.";
            };
            readonly negativePrompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The negative prompt used for the video generation.";
            };
            readonly promptEnhance: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether to enhance the prompt.";
            };
            readonly duration: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Duration of the output video in seconds. Allowed values: 4, 6, or 8 on models VEO3 and VEO3FAST (default: 8) and 5 or 10 on model KLING2_5 (default: 5).";
            };
            readonly promptEnhanceInstruction: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "A natural language instruction used to modify the main prompt. For example, 'make it cinematic', 'add a rainbow', or 'change the subject to a cat'.";
            };
            readonly styleIds: {
                readonly title: "Array of Strings";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Predefined styles to enhance the prompt. This accepts a list of style uuids.";
            };
            readonly elements: {
                readonly title: "Array of Element Inputs";
                readonly type: "array";
                readonly items: {
                    readonly properties: {
                        readonly akUUID: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "Unique identifier for element. Elements can be found from the List Elements endpoint.";
                        };
                        readonly weight: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly default: 1;
                            readonly description: "Weight for the element";
                        };
                    };
                    readonly required: readonly ["akUUID"];
                    readonly title: "element_input";
                    readonly type: "object";
                };
                readonly description: "An array of elements/loras objects that will be applied sequentially to the output. Elements are only supported for Motion2.0 generations. ";
            };
            readonly height: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Height of the output video. Acceptable values vary based on model";
            };
            readonly width: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Width of the output video. Acceptable values vary based on model";
            };
        };
        readonly type: "object";
        readonly required: readonly ["prompt", "imageId", "imageType"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly motionVideoGenerationJob: {
                    readonly properties: {
                        readonly generationId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "MotionVideoGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateLcmGeneration: {
    readonly body: {
        readonly properties: {
            readonly imageDataUrl: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Image data used to generate image. In base64 format. Prefix: `data:image/jpeg;base64,`";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate images";
            };
            readonly guidance: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How strongly the generation should reflect the prompt. Must be a float between 0.5 and 20.";
            };
            readonly strength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Creativity strength of generation. Higher strength will deviate more from the original image supplied in imageDataUrl. Must be a float between 0.1 and 1.";
            };
            readonly requestTimestamp: {
                readonly type: "string";
                readonly title: "timestamp";
            };
            readonly style: {
                readonly type: "string";
                readonly title: "lcm_generation_style";
                readonly enum: readonly ["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUSTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"];
                readonly description: "The style to generate LCM images with.";
            };
            readonly steps: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of steps to use for the generation. Must be between 4 and 16.";
            };
            readonly width: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly height: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
        };
        readonly type: "object";
        readonly required: readonly ["imageDataUrl", "prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly lcmGenerationJob: {
                    readonly properties: {
                        readonly imageDataUrl: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly requestTimestamp: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "LcmGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateModel: {
    readonly body: {
        readonly properties: {
            readonly name: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The name of the model.";
            };
            readonly description: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The description of the model.";
            };
            readonly datasetId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the dataset to train the model on.";
            };
            readonly instance_prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The instance prompt to use during training.";
            };
            readonly modelType: {
                readonly type: "string";
                readonly default: "GENERAL";
                readonly title: "custom_model_type";
                readonly enum: readonly ["GENERAL", "BUILDINGS", "CHARACTERS", "ENVIRONMENTS", "FASHION", "ILLUSTRATIONS", "GAME_ITEMS", "GRAPHICAL_ELEMENTS", "PHOTOGRAPHY", "PIXEL_ART", "PRODUCT_DESIGN", "TEXTURES", "UI_ELEMENTS", "VECTOR"];
                readonly description: "The category the most accurately reflects the model.";
            };
            readonly nsfw: {
                readonly default: false;
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether or not the model is NSFW.";
            };
            readonly resolution: {
                readonly default: 512;
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The resolution for training. Must be 512 or 768.";
            };
            readonly sd_version: {
                readonly title: "sd_versions";
                readonly enum: readonly ["v1_5", "v2"];
                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5.";
            };
            readonly strength: {
                readonly type: "string";
                readonly title: "strength";
                readonly enum: readonly ["VERY_LOW", "LOW", "MEDIUM", "HIGH"];
                readonly description: "When training using the PIXEL_ART model type, this influences the training strength.";
                readonly default: "MEDIUM";
            };
        };
        readonly required: readonly ["name", "datasetId", "instance_prompt"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly sdTrainingJob: {
                    readonly properties: {
                        readonly customModelId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Model Training. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDTrainingOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateSvdMotionGeneration: {
    readonly body: {
        readonly properties: {
            readonly imageId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the image, supports generated images, variation images, and init images.";
            };
            readonly isPublic: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generation is public or not";
            };
            readonly isInitImage: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "If it is an init image uploaded by the user. This image is uploaded from endpoint: Upload init image.";
            };
            readonly isVariation: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "If it is a variation image.";
            };
            readonly motionStrength: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The motion strength.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["imageId"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly motionSvdGenerationJob: {
                    readonly properties: {
                        readonly generationId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "MotionSvdGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateTextToVideoGeneration: {
    readonly body: {
        readonly properties: {
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate video";
            };
            readonly resolution: {
                readonly title: "String";
                readonly enum: readonly ["RESOLUTION_480", "RESOLUTION_720", "RESOLUTION_1080"];
                readonly description: "The resolution of the output video. Acceptable values vary based on model";
            };
            readonly model: {
                readonly title: "String";
                readonly enum: readonly ["MOTION2", "VEO3", "MOTION2FAST", "VEO3FAST", "KLING2_1", "KLING2_5"];
                readonly description: "The model to use for the video generation. Defaults to MOTION2 if not specified.";
                readonly default: "MOTION2";
            };
            readonly frameInterpolation: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Smoothly blend frames for fluid video transitions using Interpolation.";
            };
            readonly isPublic: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether the generation is public or not";
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Motion 2.0 and 4294967293 for Veo3.";
            };
            readonly negativePrompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The negative prompt used for the video generation.";
            };
            readonly promptEnhance: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Whether to enhance the prompt.";
            };
            readonly promptEnhanceInstruction: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "A natural language instruction used to modify the main prompt. For example, 'make it cinematic', 'add a rainbow', or 'change the subject to a cat'.";
            };
            readonly styleIds: {
                readonly title: "Array of Strings";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Predefined styles to enhance the prompt. This accepts a list of style uuids.";
            };
            readonly height: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Height of the output video. Acceptable values vary based on model";
            };
            readonly width: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Width of the output video. Acceptable values vary based on model";
            };
            readonly duration: {
                readonly title: "Integer";
                readonly type: "integer";
                readonly description: "Duration of the output video in seconds. Defaults to 8 seconds if not specified. Allowed values: 4, 6, or 8. Supported on models VEO3 and VEO3FAST.";
                readonly default: 8;
            };
            readonly elements: {
                readonly title: "Array of Element Inputs";
                readonly type: "array";
                readonly items: {
                    readonly properties: {
                        readonly akUUID: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "Unique identifier for element. Elements can be found from the List Elements endpoint.";
                        };
                        readonly weight: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly default: 1;
                            readonly description: "Weight for the element";
                        };
                    };
                    readonly required: readonly ["akUUID"];
                    readonly title: "element_input";
                    readonly type: "object";
                };
                readonly description: "An array of elements/loras objects that will be applied sequentially to the output. Elements are only supported for Motion2.0 generations. ";
            };
        };
        readonly type: "object";
        readonly required: readonly ["prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly motionVideoGenerationJob: {
                    readonly properties: {
                        readonly generationId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "MotionVideoGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateTextureGeneration: {
    readonly body: {
        readonly properties: {
            readonly front_rotation_offset: {
                readonly title: "Int";
                readonly type: "integer";
            };
            readonly modelAssetId: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly negative_prompt: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly preview: {
                readonly title: "Boolean";
                readonly type: "boolean";
            };
            readonly preview_direction: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly sd_version: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly textureGenerationJob: {
                    readonly properties: {
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Texture Generation. Available for Production API Users.";
                        };
                    };
                    readonly title: "TextureGenerationJobOutput";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateUniversalUpscalerJob: {
    readonly body: {
        readonly properties: {
            readonly creativityStrength: {
                readonly title: "Int";
                readonly type: "integer";
                readonly default: 5;
                readonly description: "The creativity strength of the universal upscaler. Must be between 1 and 10.";
            };
            readonly detailContrast: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The detail contrast of the universal upscaler. Must be between 1 and 10. Can only be used with ultraUpscaleStyle.";
            };
            readonly generatedImageId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the generated image.";
            };
            readonly initImageId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the init image uploaded.";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt for the universal upscaler.";
            };
            readonly similarity: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The similarity of the universal upscaler. Must be between 1 and 10. Can only be used with ultraUpscaleStyle.";
            };
            readonly ultraUpscaleStyle: {
                readonly type: "string";
                readonly title: "universal_upscaler_ultra_style";
                readonly enum: readonly ["ARTISTIC", "REALISTIC"];
                readonly description: "The ultra style to upscale images using universal upscaler with. Can not be used with upscalerStyle.";
            };
            readonly upscaleMultiplier: {
                readonly title: "Float";
                readonly type: "number";
                readonly default: 1.5;
                readonly description: "The upscale multiplier of the universal upscaler. Must be between 1.0 and 2.0.";
            };
            readonly upscalerStyle: {
                readonly type: "string";
                readonly default: "GENERAL";
                readonly title: "universal_upscaler_style";
                readonly enum: readonly ["GENERAL", "CINEMATIC", "2D ART & ILLUSTRATION", "CG ART & GAME ASSETS"];
                readonly description: "The style to upscale images using universal upscaler with. Can not be used with ultraUpscaleStyle.";
            };
            readonly variationId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the variation image.";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly universalUpscaler: {
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Universal Upscaler Variation. Available for Production API Users.";
                        };
                    };
                    readonly title: "UniversalUpscalerOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateVariationNoBg: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly isVariation: {
                readonly type: "boolean";
                readonly title: "Boolean";
            };
        };
        readonly required: readonly ["id"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly sdNobgJob: {
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for No Background Variation. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDUpscaleJobOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateVariationUnzoom: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly isVariation: {
                readonly title: "Boolean";
                readonly type: "boolean";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly sdUnzoomJob: {
                    readonly properties: {
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Unzoom Variation. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDUnzoomOutput";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateVariationUpscale: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly title: "String";
                readonly type: "string";
            };
        };
        readonly required: readonly ["id"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly sdUpscaleJob: {
                    readonly properties: {
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Upscale Variation. Available for Production API Users.";
                        };
                    };
                    readonly title: "SDUpscaleJobOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateVideoUpscale: {
    readonly body: {
        readonly properties: {
            readonly resolution: {
                readonly title: "String";
                readonly enum: readonly ["RESOLUTION_720"];
                readonly description: "The resolution of the upscaled video. RESOLUTION_720 is the only option for now.";
            };
            readonly sourceGenerationId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the source video generation to upscale.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["resolution", "sourceGenerationId"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly motionVideoGenerationJob: {
                    readonly properties: {
                        readonly generationId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly variationId: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "The ID of the upscale variation.";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "MotionVideoGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const Delete3DModelById: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required (enter it either in parameters or request body)_";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly delete_model_assets_by_pk: {
                    readonly description: "columns and relationships of \"model_assets\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "model_assets";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteDatasetById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the dataset to delete.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly delete_datasets_by_pk: {
                    readonly description: "columns and relationships of \"datasets\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "datasets";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteElementById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[0-9]{*}";
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the element to delete.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly delete_user_loras_by_pk: {
                    readonly description: "columns and relationships of \"user_loras\".";
                    readonly properties: {
                        readonly id: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                    };
                    readonly title: "user_loras";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteGenerationById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the generation to delete.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly delete_generations_by_pk: {
                    readonly description: "columns and relationships of \"generations\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "generations";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteInitImageById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required_";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly delete_init_images_by_pk: {
                    readonly description: "columns and relationships of \"init_images\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "init_images";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteModelById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the model to delete.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly delete_custom_models_by_pk: {
                    readonly description: "columns and relationships of \"custom_models\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "custom_models";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteTextureGenerationById: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required (enter it either in parameters or request body)_";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly delete_model_asset_texture_generations_by_pk: {
                    readonly description: "columns and relationships of \"model_asset_texture_generations\"";
                    readonly properties: {
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "model_asset_texture_generations";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const Get3DModelById: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required (enter it either in parameters or request body)_";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly default: 0;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly default: 10;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly model_assets_by_pk: {
                    readonly description: "columns and relationships of \"model_assets\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly meshUrl: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly userId: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                    };
                    readonly title: "model_assets";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const Get3DModelsByUserId: {
    readonly body: {
        readonly properties: {
            readonly userId: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly userId: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["userId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly default: 0;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly default: 10;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly model_assets: {
                    readonly items: {
                        readonly description: "columns and relationships of \"model_assets\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly meshUrl: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly updatedAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly userId: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                        };
                        readonly title: "model_assets";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetCustomElementsByUserId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly userId: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the user to return.";
                };
            };
            readonly required: readonly ["userId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly user_loras: {
                    readonly items: {
                        readonly description: "columns and relationships of \"user_loras\".";
                        readonly title: "user_loras";
                        readonly type: "object";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly description: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly id: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly instancePrompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly resolution: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly learningRate: {
                                readonly title: "Float";
                                readonly type: "number";
                            };
                            readonly trainingEpoch: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly name: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly trainTextEncoder: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                            readonly baseModel: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                            readonly focus: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly updatedAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                        };
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetCustomModelsByUserId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly userId: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the user to return.";
                };
            };
            readonly required: readonly ["userId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly custom_models: {
                    readonly items: {
                        readonly description: "columns and relationships of \"custom_models\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly description: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly instancePrompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly modelHeight: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly modelWidth: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly name: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly public: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                            readonly sdVersion: {
                                readonly type: "string";
                                readonly title: "sd_versions";
                                readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly default: "GENERAL";
                                readonly title: "custom_model_type";
                                readonly enum: readonly ["GENERAL", "BUILDINGS", "CHARACTERS", "ENVIRONMENTS", "FASHION", "ILLUSTRATIONS", "GAME_ITEMS", "GRAPHICAL_ELEMENTS", "PHOTOGRAPHY", "PIXEL_ART", "PRODUCT_DESIGN", "TEXTURES", "UI_ELEMENTS", "VECTOR"];
                                readonly description: "The category the most accurately reflects the model.\n\n`GENERAL` `BUILDINGS` `CHARACTERS` `ENVIRONMENTS` `FASHION` `ILLUSTRATIONS` `GAME_ITEMS` `GRAPHICAL_ELEMENTS` `PHOTOGRAPHY` `PIXEL_ART` `PRODUCT_DESIGN` `TEXTURES` `UI_ELEMENTS` `VECTOR`";
                            };
                            readonly updatedAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                        };
                        readonly title: "custom_models";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetDatasetById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the dataset to return.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly datasets_by_pk: {
                    readonly description: "columns and relationships of \"datasets\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly dataset_images: {
                            readonly items: {
                                readonly description: "columns and relationships of \"dataset_images\"";
                                readonly properties: {
                                    readonly createdAt: {
                                        readonly type: "string";
                                        readonly title: "timestamp";
                                    };
                                    readonly id: {
                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                        readonly title: "uuid";
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly title: "String";
                                        readonly type: "string";
                                    };
                                };
                                readonly title: "dataset_images";
                                readonly type: "object";
                            };
                            readonly type: "array";
                        };
                        readonly description: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                    };
                    readonly title: "datasets";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetElementById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[0-9]{*}";
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the custom element to return.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly user_loras_by_pk: {
                    readonly description: "columns and relationships of \"user_loras\".";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly description: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly instancePrompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly resolution: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly learningRate: {
                            readonly title: "Float";
                            readonly type: "number";
                        };
                        readonly trainingEpoch: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly name: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly trainTextEncoder: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                        };
                        readonly baseModel: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly title: "job_status";
                            readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                            readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                        };
                        readonly focus: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                    };
                    readonly title: "user_loras";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetGenerationById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the generation to return.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly generations_by_pk: {
                    readonly description: "columns and relationships of \"generations\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly generated_images: {
                            readonly items: {
                                readonly description: "columns and relationships of \"generated_images\"";
                                readonly properties: {
                                    readonly generated_image_variation_generics: {
                                        readonly items: {
                                            readonly description: "columns and relationships of \"generated_image_variation_generic\"";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                                    readonly title: "uuid";
                                                    readonly type: "string";
                                                };
                                                readonly status: {
                                                    readonly type: "string";
                                                    readonly title: "job_status";
                                                    readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                                    readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                                                };
                                                readonly transformType: {
                                                    readonly type: "string";
                                                    readonly title: "VARIATION_TYPE";
                                                    readonly enum: readonly ["OUTPAINT", "INPAINT", "UPSCALE", "UNZOOM", "NOBG"];
                                                    readonly description: "The type of variation.\n\n`OUTPAINT` `INPAINT` `UPSCALE` `UNZOOM` `NOBG`";
                                                };
                                                readonly url: {
                                                    readonly title: "String";
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly title: "generated_image_variation_generic";
                                            readonly type: "object";
                                        };
                                        readonly type: "array";
                                    };
                                    readonly fantasyAvatar: {
                                        readonly title: "Boolean";
                                        readonly type: "boolean";
                                        readonly description: "If fantasyAvatar feature was used.";
                                    };
                                    readonly id: {
                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                        readonly title: "uuid";
                                        readonly type: "string";
                                    };
                                    readonly imageToVideo: {
                                        readonly title: "Boolean";
                                        readonly type: "boolean";
                                        readonly description: "If it is an image to video generation.";
                                    };
                                    readonly likeCount: {
                                        readonly title: "Int";
                                        readonly type: "integer";
                                    };
                                    readonly motion: {
                                        readonly title: "Boolean";
                                        readonly type: "boolean";
                                        readonly description: "If generation is of motion type.";
                                    };
                                    readonly motionModel: {
                                        readonly title: "String";
                                        readonly type: "string";
                                        readonly description: "The name of the motion model.";
                                    };
                                    readonly motionMP4URL: {
                                        readonly title: "String";
                                        readonly type: "string";
                                        readonly description: "The URL of the motion MP4.";
                                    };
                                    readonly motionStrength: {
                                        readonly title: "Int";
                                        readonly type: "integer";
                                        readonly description: "The motion strength.";
                                    };
                                    readonly nsfw: {
                                        readonly title: "Boolean";
                                        readonly type: "boolean";
                                    };
                                    readonly url: {
                                        readonly title: "String";
                                        readonly type: "string";
                                    };
                                };
                                readonly title: "generated_images";
                                readonly type: "object";
                            };
                            readonly type: "array";
                        };
                        readonly generation_elements: {
                            readonly items: {
                                readonly description: "This table captures the elements that are applied to Generations.";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "integer";
                                        readonly title: "bigint";
                                    };
                                    readonly lora: {
                                        readonly description: "Element used for the generation.";
                                        readonly properties: {
                                            readonly akUUID: {
                                                readonly type: "string";
                                                readonly description: "Unique identifier for the element. Elements can be found from the List Elements endpoint.";
                                            };
                                            readonly baseModel: {
                                                readonly type: "string";
                                                readonly title: "sd_versions";
                                                readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                                                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                                readonly description: "Description for the element";
                                            };
                                            readonly name: {
                                                readonly type: "string";
                                                readonly description: "Name of the element";
                                            };
                                            readonly urlImage: {
                                                readonly type: "string";
                                                readonly description: "URL of the element image";
                                            };
                                            readonly weightDefault: {
                                                readonly type: "integer";
                                                readonly description: "Default weight for the element";
                                            };
                                            readonly weightMax: {
                                                readonly type: "integer";
                                                readonly description: "Maximum weight for the element";
                                            };
                                            readonly weightMin: {
                                                readonly type: "integer";
                                                readonly description: "Minimum weight for the element";
                                            };
                                        };
                                        readonly title: "loras";
                                        readonly type: "object";
                                    };
                                    readonly weightApplied: {
                                        readonly type: "number";
                                        readonly title: "numeric";
                                    };
                                };
                                readonly title: "generation_elements";
                                readonly type: "object";
                            };
                            readonly type: "array";
                        };
                        readonly guidanceScale: {
                            readonly type: "number";
                            readonly title: "float8";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly imageHeight: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly imageWidth: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly inferenceSteps: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly initStrength: {
                            readonly type: "number";
                            readonly title: "float8";
                        };
                        readonly modelId: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly negativePrompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly photoReal: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                            readonly description: "If photoReal feature was used.";
                        };
                        readonly photoRealStrength: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly description: "Depth of field of photoReal used. 0.55 is low, 0.5 is medium, and 0.45 is high. Default is 0.55.";
                        };
                        readonly presetStyle: {
                            readonly type: "string";
                            readonly title: "sd_generation_style";
                            readonly enum: readonly ["ANIME", "BOKEH", "CINEMATIC", "CINEMATIC_CLOSEUP", "CREATIVE", "DYNAMIC", "ENVIRONMENT", "FASHION", "FILM", "FOOD", "GENERAL", "HDR", "ILLUSTRATION", "LEONARDO", "LONG_EXPOSURE", "MACRO", "MINIMALISTIC", "MONOCHROME", "MOODY", "NONE", "NEUTRAL", "PHOTOGRAPHY", "PORTRAIT", "RAYTRACED", "RENDER_3D", "RETRO", "SKETCH_BW", "SKETCH_COLOR", "STOCK_PHOTO", "VIBRANT", "UNPROCESSED"];
                            readonly description: "The style to generate images with. When photoReal is enabled, refer to the Guide section for a full list. When alchemy is disabled, use LEONARDO or NONE. When alchemy is enabled, use ANIME, CREATIVE, DYNAMIC, ENVIRONMENT, GENERAL, ILLUSTRATION, PHOTOGRAPHY, RAYTRACED, RENDER_3D, SKETCH_BW, SKETCH_COLOR, or NONE.\n\n`ANIME` `BOKEH` `CINEMATIC` `CINEMATIC_CLOSEUP` `CREATIVE` `DYNAMIC` `ENVIRONMENT` `FASHION` `FILM` `FOOD` `GENERAL` `HDR` `ILLUSTRATION` `LEONARDO` `LONG_EXPOSURE` `MACRO` `MINIMALISTIC` `MONOCHROME` `MOODY` `NONE` `NEUTRAL` `PHOTOGRAPHY` `PORTRAIT` `RAYTRACED` `RENDER_3D` `RETRO` `SKETCH_BW` `SKETCH_COLOR` `STOCK_PHOTO` `VIBRANT` `UNPROCESSED`";
                            readonly default: "DYNAMIC";
                        };
                        readonly prompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly promptMagic: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                            readonly description: "If prompt magic was used.";
                        };
                        readonly promptMagicStrength: {
                            readonly title: "Float";
                            readonly type: "number";
                            readonly description: "Strength of prompt magic used.";
                        };
                        readonly promptMagicVersion: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "Version of prompt magic used.";
                        };
                        readonly public: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                        };
                        readonly scheduler: {
                            readonly type: "string";
                            readonly title: "sd_generation_schedulers";
                            readonly enum: readonly ["KLMS", "EULER_ANCESTRAL_DISCRETE", "EULER_DISCRETE", "DDIM", "DPM_SOLVER", "PNDM", "LEONARDO"];
                            readonly description: "The scheduler to generate images with. Defaults to EULER_DISCRETE if not specified.\n\n`KLMS` `EULER_ANCESTRAL_DISCRETE` `EULER_DISCRETE` `DDIM` `DPM_SOLVER` `PNDM` `LEONARDO`";
                        };
                        readonly sdVersion: {
                            readonly type: "string";
                            readonly title: "sd_versions";
                            readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                            readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                        };
                        readonly seed: {
                            readonly type: "integer";
                            readonly title: "seed";
                            readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly title: "job_status";
                            readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                            readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                        };
                        readonly ultra: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                            readonly description: "If ultra generation mode was used.";
                        };
                    };
                    readonly title: "generations";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetGenerationsByUserId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly userId: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["userId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly default: 0;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly default: 10;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly generations: {
                    readonly items: {
                        readonly description: "columns and relationships of \"generations\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly generated_images: {
                                readonly items: {
                                    readonly description: "columns and relationships of \"generated_images\"";
                                    readonly properties: {
                                        readonly generated_image_variation_generics: {
                                            readonly items: {
                                                readonly description: "columns and relationships of \"generated_image_variation_generic\"";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                                        readonly title: "uuid";
                                                        readonly type: "string";
                                                    };
                                                    readonly status: {
                                                        readonly type: "string";
                                                        readonly title: "job_status";
                                                        readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                                        readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                                                    };
                                                    readonly transformType: {
                                                        readonly type: "string";
                                                        readonly title: "VARIATION_TYPE";
                                                        readonly enum: readonly ["OUTPAINT", "INPAINT", "UPSCALE", "UNZOOM", "NOBG"];
                                                        readonly description: "The type of variation.\n\n`OUTPAINT` `INPAINT` `UPSCALE` `UNZOOM` `NOBG`";
                                                    };
                                                    readonly url: {
                                                        readonly title: "String";
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly title: "generated_image_variation_generic";
                                                readonly type: "object";
                                            };
                                            readonly type: "array";
                                        };
                                        readonly id: {
                                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                            readonly title: "uuid";
                                            readonly type: "string";
                                        };
                                        readonly imageToVideo: {
                                            readonly title: "Boolean";
                                            readonly type: "boolean";
                                            readonly description: "If it is an image to video generation.";
                                        };
                                        readonly likeCount: {
                                            readonly title: "Int";
                                            readonly type: "integer";
                                        };
                                        readonly motion: {
                                            readonly title: "Boolean";
                                            readonly type: "boolean";
                                            readonly description: "If generation is of motion type.";
                                        };
                                        readonly motionModel: {
                                            readonly title: "String";
                                            readonly type: "string";
                                            readonly description: "The name of the motion model.";
                                        };
                                        readonly motionMP4URL: {
                                            readonly title: "String";
                                            readonly type: "string";
                                            readonly description: "The URL of the motion MP4.";
                                        };
                                        readonly motionStrength: {
                                            readonly title: "Int";
                                            readonly type: "integer";
                                            readonly description: "The motion strength.";
                                        };
                                        readonly nsfw: {
                                            readonly title: "Boolean";
                                            readonly type: "boolean";
                                        };
                                        readonly url: {
                                            readonly title: "String";
                                            readonly type: "string";
                                        };
                                    };
                                    readonly title: "generated_images";
                                    readonly type: "object";
                                };
                                readonly type: "array";
                            };
                            readonly generation_elements: {
                                readonly items: {
                                    readonly description: "This table captures the elements that are applied to a Generations, also the order and weightings used when applied.";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "integer";
                                            readonly title: "bigint";
                                        };
                                        readonly lora: {
                                            readonly description: "Element used for the generation.";
                                            readonly properties: {
                                                readonly akUUID: {
                                                    readonly type: "string";
                                                    readonly description: "Unique identifier for the element. Elements can be found from the List Elements endpoint.";
                                                };
                                                readonly baseModel: {
                                                    readonly type: "string";
                                                    readonly title: "sd_versions";
                                                    readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                                                    readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                    readonly description: "Description for the element";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                    readonly description: "Name of the element";
                                                };
                                                readonly urlImage: {
                                                    readonly type: "string";
                                                    readonly description: "URL of the element image";
                                                };
                                                readonly weightDefault: {
                                                    readonly type: "integer";
                                                    readonly description: "Default weight for the element";
                                                };
                                                readonly weightMax: {
                                                    readonly type: "integer";
                                                    readonly description: "Maximum weight for the element";
                                                };
                                                readonly weightMin: {
                                                    readonly type: "integer";
                                                    readonly description: "Minimum weight for the element";
                                                };
                                            };
                                            readonly title: "elements";
                                            readonly type: "object";
                                        };
                                        readonly weightApplied: {
                                            readonly type: "number";
                                            readonly title: "numeric";
                                        };
                                    };
                                    readonly title: "generation_elements";
                                    readonly type: "object";
                                };
                                readonly type: "array";
                            };
                            readonly guidanceScale: {
                                readonly type: "number";
                                readonly title: "float8";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly imageHeight: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly imageWidth: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly inferenceSteps: {
                                readonly title: "Int";
                                readonly type: "integer";
                            };
                            readonly initStrength: {
                                readonly type: "number";
                                readonly title: "float8";
                            };
                            readonly modelId: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly negativePrompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly photoReal: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "If photoReal feature was used.";
                            };
                            readonly photoRealStrength: {
                                readonly title: "Float";
                                readonly type: "number";
                                readonly description: "Depth of field of photoReal used. 0.55 is low, 0.5 is medium, and 0.45 is high. Default is 0.55.";
                            };
                            readonly presetStyle: {
                                readonly type: "string";
                                readonly title: "sd_generation_style";
                                readonly enum: readonly ["ANIME", "BOKEH", "CINEMATIC", "CINEMATIC_CLOSEUP", "CREATIVE", "DYNAMIC", "ENVIRONMENT", "FASHION", "FILM", "FOOD", "GENERAL", "HDR", "ILLUSTRATION", "LEONARDO", "LONG_EXPOSURE", "MACRO", "MINIMALISTIC", "MONOCHROME", "MOODY", "NONE", "NEUTRAL", "PHOTOGRAPHY", "PORTRAIT", "RAYTRACED", "RENDER_3D", "RETRO", "SKETCH_BW", "SKETCH_COLOR", "STOCK_PHOTO", "VIBRANT", "UNPROCESSED"];
                                readonly description: "The style to generate images with. When photoReal is enabled, refer to the Guide section for a full list. When alchemy is disabled, use LEONARDO or NONE. When alchemy is enabled, use ANIME, CREATIVE, DYNAMIC, ENVIRONMENT, GENERAL, ILLUSTRATION, PHOTOGRAPHY, RAYTRACED, RENDER_3D, SKETCH_BW, SKETCH_COLOR, or NONE.\n\n`ANIME` `BOKEH` `CINEMATIC` `CINEMATIC_CLOSEUP` `CREATIVE` `DYNAMIC` `ENVIRONMENT` `FASHION` `FILM` `FOOD` `GENERAL` `HDR` `ILLUSTRATION` `LEONARDO` `LONG_EXPOSURE` `MACRO` `MINIMALISTIC` `MONOCHROME` `MOODY` `NONE` `NEUTRAL` `PHOTOGRAPHY` `PORTRAIT` `RAYTRACED` `RENDER_3D` `RETRO` `SKETCH_BW` `SKETCH_COLOR` `STOCK_PHOTO` `VIBRANT` `UNPROCESSED`";
                                readonly default: "DYNAMIC";
                            };
                            readonly prompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly promptMagic: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "If prompt magic was used.";
                            };
                            readonly promptMagicStrength: {
                                readonly title: "Float";
                                readonly type: "number";
                                readonly description: "Strength of prompt magic used.";
                            };
                            readonly promptMagicVersion: {
                                readonly title: "String";
                                readonly type: "string";
                                readonly description: "Version of prompt magic used.";
                            };
                            readonly public: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                            readonly scheduler: {
                                readonly type: "string";
                                readonly title: "sd_generation_schedulers";
                                readonly enum: readonly ["KLMS", "EULER_ANCESTRAL_DISCRETE", "EULER_DISCRETE", "DDIM", "DPM_SOLVER", "PNDM", "LEONARDO"];
                                readonly description: "The scheduler to generate images with. Defaults to EULER_DISCRETE if not specified.\n\n`KLMS` `EULER_ANCESTRAL_DISCRETE` `EULER_DISCRETE` `DDIM` `DPM_SOLVER` `PNDM` `LEONARDO`";
                            };
                            readonly sdVersion: {
                                readonly type: "string";
                                readonly title: "sd_versions";
                                readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                            };
                            readonly seed: {
                                readonly type: "integer";
                                readonly title: "seed";
                                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                            readonly ultra: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "If ultra generation mode was used.";
                            };
                        };
                        readonly title: "generations";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetInitImageById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required_";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly init_images_by_pk: {
                    readonly description: "columns and relationships of \"init_images\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "init_images";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetModelById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the custom model to return.";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly custom_models_by_pk: {
                    readonly description: "columns and relationships of \"custom_models\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly description: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly instancePrompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly modelHeight: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly modelWidth: {
                            readonly title: "Int";
                            readonly type: "integer";
                        };
                        readonly name: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly public: {
                            readonly title: "Boolean";
                            readonly type: "boolean";
                        };
                        readonly sdVersion: {
                            readonly type: "string";
                            readonly title: "sd_versions";
                            readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                            readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly title: "job_status";
                            readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                            readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                        };
                        readonly type: {
                            readonly type: "string";
                            readonly default: "GENERAL";
                            readonly title: "custom_model_type";
                            readonly enum: readonly ["GENERAL", "BUILDINGS", "CHARACTERS", "ENVIRONMENTS", "FASHION", "ILLUSTRATIONS", "GAME_ITEMS", "GRAPHICAL_ELEMENTS", "PHOTOGRAPHY", "PIXEL_ART", "PRODUCT_DESIGN", "TEXTURES", "UI_ELEMENTS", "VECTOR"];
                            readonly description: "The category the most accurately reflects the model.\n\n`GENERAL` `BUILDINGS` `CHARACTERS` `ENVIRONMENTS` `FASHION` `ILLUSTRATIONS` `GAME_ITEMS` `GRAPHICAL_ELEMENTS` `PHOTOGRAPHY` `PIXEL_ART` `PRODUCT_DESIGN` `TEXTURES` `UI_ELEMENTS` `VECTOR`";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                    };
                    readonly title: "custom_models";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetMotionVariationById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "\"id\" is required";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly generated_image_variation_motion: {
                    readonly items: {
                        readonly description: "columns and relationships of \"generated_image_variation_motion\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                            readonly motionTransformType: {
                                readonly type: "string";
                                readonly title: "MOTION_VARIATION_TYPE";
                                readonly enum: readonly ["UPSCALE"];
                                readonly description: "The type of motion variation.\n\n`UPSCALE`";
                            };
                            readonly resolution: {
                                readonly type: "string";
                                readonly title: "MOTION_RESOLUTION";
                                readonly enum: readonly ["RESOLUTION_720"];
                                readonly description: "The resolution of the upscaled video. RESOLUTION_720 is the only option for now.\n\n`RESOLUTION_720`";
                            };
                            readonly url: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                        };
                        readonly title: "generated_image_variation_motion";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetTextureGenerationById: {
    readonly body: {
        readonly properties: {
            readonly id: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"id\" is required (enter it either in parameters or request body)_";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly default: 0;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly default: 10;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly model_asset_texture_generations_by_pk: {
                    readonly description: "columns and relationships of \"model_asset_texture_generations\"";
                    readonly properties: {
                        readonly createdAt: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly id: {
                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                            readonly title: "uuid";
                            readonly type: "string";
                        };
                        readonly model_asset_texture_images: {
                            readonly items: {
                                readonly description: "columns and relationships of \"model_asset_texture_images\"";
                                readonly properties: {
                                    readonly id: {
                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                        readonly title: "uuid";
                                        readonly type: "string";
                                    };
                                    readonly type: {
                                        readonly type: "string";
                                        readonly default: "NORMAL";
                                        readonly title: "MODEL_ASSET_TEXTURE_TYPES";
                                        readonly enum: readonly ["ALBEDO", "NORMAL", "ROUGHNESS", "DISPLACEMENT", "HDRP_MASK"];
                                        readonly description: "When training model assets these are the texture types available to use.\n\n`ALBEDO` `NORMAL` `ROUGHNESS` `DISPLACEMENT` `HDRP_MASK`";
                                    };
                                    readonly url: {
                                        readonly title: "String";
                                        readonly type: "string";
                                    };
                                };
                                readonly title: "model_asset_texture_images";
                                readonly type: "object";
                            };
                            readonly type: "array";
                        };
                        readonly negativePrompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly prompt: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly seed: {
                            readonly type: "integer";
                            readonly title: "seed";
                            readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly title: "job_status";
                            readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                            readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                        };
                    };
                    readonly title: "model_asset_texture_generations";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetTextureGenerationsByModelId: {
    readonly body: {
        readonly properties: {
            readonly limit: {
                readonly title: "Int";
                readonly type: "integer";
            };
            readonly modelId: {
                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                readonly title: "uuid";
                readonly type: "string";
            };
            readonly offset: {
                readonly title: "Int";
                readonly type: "integer";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly modelId: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"modelId\" is required (enter it either in parameters or request body)_";
                };
            };
            readonly required: readonly ["modelId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly default: 0;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly default: 10;
                    readonly type: "integer";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly model_asset_texture_generations: {
                    readonly items: {
                        readonly description: "columns and relationships of \"model_asset_texture_generations\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly model_asset_texture_images: {
                                readonly items: {
                                    readonly description: "columns and relationships of \"model_asset_texture_images\"";
                                    readonly properties: {
                                        readonly id: {
                                            readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                            readonly title: "uuid";
                                            readonly type: "string";
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly default: "NORMAL";
                                            readonly title: "MODEL_ASSET_TEXTURE_TYPES";
                                            readonly enum: readonly ["ALBEDO", "NORMAL", "ROUGHNESS", "DISPLACEMENT", "HDRP_MASK"];
                                            readonly description: "When training model assets these are the texture types available to use.\n\n`ALBEDO` `NORMAL` `ROUGHNESS` `DISPLACEMENT` `HDRP_MASK`";
                                        };
                                        readonly url: {
                                            readonly title: "String";
                                            readonly type: "string";
                                        };
                                    };
                                    readonly title: "model_asset_texture_images";
                                    readonly type: "object";
                                };
                                readonly type: "array";
                            };
                            readonly negativePrompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly prompt: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly seed: {
                                readonly type: "integer";
                                readonly title: "seed";
                                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                        };
                        readonly title: "model_asset_texture_generations";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetUserSelf: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly user_details: {
                    readonly items: {
                        readonly description: "columns and relationships of \"user_details\"";
                        readonly properties: {
                            readonly user: {
                                readonly description: "columns and relationships of \"users\"";
                                readonly properties: {
                                    readonly id: {
                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                        readonly title: "uuid";
                                        readonly type: "string";
                                    };
                                    readonly username: {
                                        readonly title: "String";
                                        readonly type: "string";
                                        readonly description: "Username of the user.";
                                    };
                                };
                                readonly title: "users";
                                readonly type: "object";
                            };
                            readonly tokenRenewalDate: {
                                readonly title: "timestamp";
                                readonly type: "string";
                                readonly description: "User Plan Token Renewal Date.";
                            };
                            readonly paidTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of paid tokens the user has.";
                            };
                            readonly subscriptionTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of user plan subscription tokens the user has.";
                            };
                            readonly subscriptionGptTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of user plan GPT tokens the user has.";
                            };
                            readonly subscriptionModelTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of model training tokens the user has.";
                            };
                            readonly apiConcurrencySlots: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "API Concurrency Slots.";
                            };
                            readonly apiPaidTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of API paid tokens the user has.";
                            };
                            readonly apiSubscriptionTokens: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "Current balance of Enterprise API subscriptions tokens the user has.";
                            };
                            readonly apiPlanTokenRenewalDate: {
                                readonly title: "timestamp";
                                readonly type: "string";
                                readonly description: "API Plan Token Renewal Date.";
                            };
                        };
                        readonly title: "user_details";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetVariationById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "\"id\" is required";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly generated_image_variation_generic: {
                    readonly items: {
                        readonly description: "columns and relationships of \"generated_image_variation_generic\"";
                        readonly properties: {
                            readonly createdAt: {
                                readonly type: "string";
                                readonly title: "timestamp";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly title: "job_status";
                                readonly enum: readonly ["PENDING", "COMPLETE", "FAILED"];
                                readonly description: "The status of the current task.\n\n`PENDING` `COMPLETE` `FAILED`";
                            };
                            readonly transformType: {
                                readonly type: "string";
                                readonly title: "VARIATION_TYPE";
                                readonly enum: readonly ["OUTPAINT", "INPAINT", "UPSCALE", "UNZOOM", "NOBG"];
                                readonly description: "The type of variation.\n\n`OUTPAINT` `INPAINT` `UPSCALE` `UNZOOM` `NOBG`";
                            };
                            readonly url: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                        };
                        readonly title: "generated_image_variation_generic";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const ListElements: {
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly loras: {
                    readonly items: {
                        readonly description: "columns and relationships of \"elements\".";
                        readonly properties: {
                            readonly akUUID: {
                                readonly type: "string";
                                readonly description: "Unique identifier for the element. Elements can be found from the List Elements endpoint.";
                            };
                            readonly baseModel: {
                                readonly type: "string";
                                readonly title: "sd_versions";
                                readonly enum: readonly ["v1_5", "v2", "v3", "SDXL_0_8", "SDXL_0_9", "SDXL_1_0", "SDXL_LIGHTNING", "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0"];
                                readonly description: "The base version of stable diffusion to use if not using a custom model. v1_5 is 1.5, v2 is 2.1, if not specified it will default to v1_5. Also includes SDXL and SDXL Lightning models\n\n`v1_5` `v2` `v3` `SDXL_0_8` `SDXL_0_9` `SDXL_1_0` `SDXL_LIGHTNING` `PHOENIX` `FLUX` `FLUX_DEV` `KINO_2_0`";
                            };
                            readonly creatorName: {
                                readonly type: "string";
                                readonly description: "Name of the creator of the element";
                            };
                            readonly description: {
                                readonly type: "string";
                                readonly description: "Description for the element";
                            };
                            readonly name: {
                                readonly type: "string";
                                readonly description: "Name of the element";
                            };
                            readonly urlImage: {
                                readonly type: "string";
                                readonly description: "URL of the element image";
                            };
                            readonly weightDefault: {
                                readonly type: "integer";
                                readonly description: "Default weight for the element";
                            };
                            readonly weightMax: {
                                readonly type: "integer";
                                readonly description: "Maximum weight for the element";
                            };
                            readonly weightMin: {
                                readonly type: "integer";
                                readonly description: "Minimum weight for the element";
                            };
                        };
                        readonly title: "loras";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const ListPlatformModels: {
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly custom_models: {
                    readonly items: {
                        readonly description: "columns and relationships of \"custom_models\"";
                        readonly properties: {
                            readonly description: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly featured: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                            readonly generated_image: {
                                readonly description: "columns and relationships of \"generated_images\"";
                                readonly properties: {
                                    readonly id: {
                                        readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                        readonly title: "uuid";
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly title: "String";
                                        readonly type: "string";
                                    };
                                };
                                readonly title: "generated_images";
                                readonly type: "object";
                            };
                            readonly id: {
                                readonly pattern: "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}";
                                readonly title: "uuid";
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly title: "String";
                                readonly type: "string";
                            };
                            readonly nsfw: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                        };
                        readonly title: "custom_models";
                        readonly type: "object";
                    };
                    readonly type: "array";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PerformAlchemyUpscaleLcm: {
    readonly body: {
        readonly properties: {
            readonly imageDataUrl: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Image data used to generate image. In base64 format. Prefix: `data:image/jpeg;base64,`";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate images";
            };
            readonly guidance: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How strongly the generation should reflect the prompt. Must be a float between 0.5 and 20.";
            };
            readonly strength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Creativity strength of generation. Higher strength will deviate more from the original image supplied in imageDataUrl. Must be a float between 0.1 and 1.";
            };
            readonly requestTimestamp: {
                readonly type: "string";
                readonly title: "timestamp";
            };
            readonly style: {
                readonly type: "string";
                readonly title: "lcm_generation_style";
                readonly enum: readonly ["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUSTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"];
                readonly description: "The style to generate LCM images with.";
            };
            readonly steps: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of steps to use for the generation. Must be between 4 and 16.";
            };
            readonly width: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly height: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
            readonly refineCreative: {
                readonly title: "Boolean";
                readonly type: "boolean";
                readonly description: "Refine creative";
            };
            readonly refineStrength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Must be a float between 0.5 and 0.9.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["imageDataUrl", "prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly lcmGenerationJob: {
                    readonly properties: {
                        readonly imageDataUrl: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly generationId: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly variationId: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly generatedImageId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly requestTimestamp: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "LcmGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PerformInpaintingLcm: {
    readonly body: {
        readonly properties: {
            readonly imageDataUrl: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Image data used to generate image. In base64 format. Prefix: `data:image/jpeg;base64,`";
            };
            readonly maskDataUrl: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Image data of the mask layer used for inpainting. In base64 format. Prefix: `data:image/jpeg;base64,`. Mask should be white on black where generation is applied to the white area.";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate images";
            };
            readonly guidance: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How strongly the generation should reflect the prompt. Must be a float between 0.5 and 20.";
            };
            readonly strength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Creativity strength of generation. Higher strength will deviate more from the original image supplied in imageDataUrl. Must be a float between 0.1 and 1.";
            };
            readonly requestTimestamp: {
                readonly type: "string";
                readonly title: "timestamp";
            };
            readonly style: {
                readonly type: "string";
                readonly title: "lcm_generation_style";
                readonly enum: readonly ["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUSTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"];
                readonly description: "The style to generate LCM images with.";
            };
            readonly steps: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of steps to use for the generation. Must be between 4 and 16.";
            };
            readonly width: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly height: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
        };
        readonly type: "object";
        readonly required: readonly ["imageDataUrl", "maskDataUrl", "prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly lcmGenerationJob: {
                    readonly properties: {
                        readonly imageDataUrl: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly requestTimestamp: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "LcmGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PerformInstantRefine: {
    readonly body: {
        readonly properties: {
            readonly imageDataUrl: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Image data used to generate image. In base64 format. Prefix: `data:image/jpeg;base64,`";
            };
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt used to generate images";
            };
            readonly guidance: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "How strongly the generation should reflect the prompt. Must be a float between 0.5 and 20.";
            };
            readonly strength: {
                readonly title: "Float";
                readonly type: "number";
                readonly description: "Creativity strength of generation. Higher strength will deviate more from the original image supplied in imageDataUrl. Must be a float between 0.1 and 1.";
            };
            readonly requestTimestamp: {
                readonly type: "string";
                readonly title: "timestamp";
            };
            readonly style: {
                readonly type: "string";
                readonly title: "lcm_generation_style";
                readonly enum: readonly ["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUSTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"];
                readonly description: "The style to generate LCM images with.";
            };
            readonly steps: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The number of steps to use for the generation. Must be between 4 and 16.";
            };
            readonly width: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly height: {
                readonly title: "Int";
                readonly type: "integer";
                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                readonly default: 512;
            };
            readonly seed: {
                readonly type: "integer";
                readonly title: "seed";
                readonly description: "Apply a fixed seed to maintain consistency across generation sets. The maximum seed value is 2147483637 for Flux and 9999999998 for other models";
            };
        };
        readonly type: "object";
        readonly required: readonly ["imageDataUrl", "prompt"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly lcmGenerationJob: {
                    readonly properties: {
                        readonly imageDataUrl: {
                            readonly title: "Array of Strings";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly requestTimestamp: {
                            readonly type: "string";
                            readonly title: "timestamp";
                        };
                        readonly apiCreditCost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API credits cost, available for Production API users.";
                        };
                    };
                    readonly title: "LcmGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingCalculator: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly service: {
                readonly type: "string";
                readonly title: "pricingCalculatorServices";
                readonly enum: readonly ["IMAGE_GENERATION", "FANTASY_AVATAR_GENERATION", "MOTION_SVD_GENERATION", "MOTION_VIDEO_GENERATION", "VEO3_MOTION_VIDEO_GENERATION", "LCM_GENERATION", "MODEL_TRAINING", "TEXTURE_GENERATION", "UNIVERSAL_UPSCALER", "UNIVERSAL_UPSCALER_ULTRA"];
                readonly description: "The services to be chosen for calculating the API credit cost.";
            };
            readonly serviceParams: {
                readonly title: "Object";
                readonly type: "object";
                readonly description: "Parameters for the service";
                readonly properties: {
                    readonly IMAGE_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for IMAGE_GENERATION service";
                        readonly properties: {
                            readonly imageHeight: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input height of the images. Must be between 32 and 1024 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features";
                            };
                            readonly imageWidth: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input height of the images. Must be between 32 and 1024 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features";
                            };
                            readonly numImages: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The number of images to generate. Must be between 1 and 8. If either width or height is over 768, must be between 1 and 4.";
                            };
                            readonly inferenceSteps: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The Step Count to use for the generation. Must be between 10 and 60.";
                            };
                            readonly promptMagic: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Prompt Magic.";
                            };
                            readonly promptMagicStrength: {
                                readonly title: "Float";
                                readonly type: "number";
                                readonly description: "Strength of prompt magic. Must be a float between 0.1 and 1.0";
                            };
                            readonly promptMagicVersion: {
                                readonly title: "String";
                                readonly type: "string";
                                readonly description: "Prompt magic version v2 or v3, for use when promptMagic: true";
                            };
                            readonly alchemyMode: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Alchemy.";
                            };
                            readonly photoRealMode: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use PhotoReal. Requires enabling alchemy.";
                            };
                            readonly photoRealStrength: {
                                readonly title: "Float";
                                readonly type: "number";
                                readonly description: "Depth of field of photoReal. Must be 0.55 for low, 0.5 for medium, or 0.45 for high. Defaults to 0.55 if not specified.";
                            };
                            readonly photoRealVersion: {
                                readonly title: "String";
                                readonly type: "string";
                                readonly description: "The version of photoReal to use. Must be v1 or v2.";
                            };
                            readonly highResolution: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use high resolution.";
                            };
                            readonly loraCount: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The number of elements used for the generation.";
                            };
                            readonly isModelCustom: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use custom model.";
                            };
                            readonly controlnetsCost: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The total cost of controlnets input.";
                            };
                            readonly isPhoenix: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Phoenix model.";
                            };
                            readonly isSDXL: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use SDXL model.";
                            };
                            readonly isSDXLLightning: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use SDXL Lightning model.";
                            };
                            readonly isUltra: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Ultra mode.";
                            };
                            readonly isFluxSchnell: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Flux Schnell model.";
                            };
                            readonly isFluxDev: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Flux Dev model.";
                            };
                            readonly isFluxKontext: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable to use Flux Kontext model.";
                            };
                        };
                    };
                    readonly FANTASY_AVATAR_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for FANTASY_AVATAR_GENERATION service";
                        readonly properties: {
                            readonly imageHeight: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input height of the images. Must be between 32 and 1024 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features";
                            };
                            readonly imageWidth: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input height of the images. Must be between 32 and 1024 and be a multiple of 8. Note: Input resolution is not always the same as output resolution due to upscaling from other features";
                            };
                            readonly numImages: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The number of images to generate. Must be between 1 and 8. If either width or height is over 768, must be between 1 and 4.";
                            };
                        };
                    };
                    readonly MOTION_SVD_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for MOTION_SVD_GENERATION service";
                        readonly properties: {};
                    };
                    readonly MOTION_VIDEO_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for MOTION_VIDEO_GENERATION service";
                        readonly properties: {
                            readonly resolution: {
                                readonly title: "String";
                                readonly type: "string";
                                readonly description: "The resolution of the video. Must be RESOLUTION_480 or RESOLUTION_720.";
                            };
                        };
                    };
                    readonly VEO3_MOTION_VIDEO_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for VEO3_MOTION_VIDEO_GENERATION service";
                        readonly properties: {
                            readonly resolution: {
                                readonly title: "String";
                                readonly type: "string";
                                readonly enum: readonly ["RESOLUTION_720"];
                                readonly description: "The resolution of the video. Supported resolution for VEO3 is RESOLUTION_720.";
                            };
                        };
                    };
                    readonly LCM_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for LCM_GENERATION service";
                        readonly properties: {
                            readonly height: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The output height of the image. Must be 512, 640 or 1024.";
                            };
                            readonly width: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The output width of the image. Must be 512, 640 or 1024.";
                            };
                            readonly instantRefine: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable for instant upscale";
                            };
                            readonly refine: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                                readonly description: "Enable for normal alchemy upscale";
                            };
                        };
                    };
                    readonly MODEL_TRAINING: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for MODEL_TRAINING service";
                        readonly properties: {
                            readonly resolution: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The resolution for training. Must be 512, 768, or 1024.";
                            };
                            readonly sd_version: {
                                readonly title: "sd_version";
                                readonly enum: readonly ["FLUX_DEV"];
                                readonly description: "The model for the training. Can be set to 'FLUX_DEV' for FLUX_DEV specific pricing or can be omitted.";
                            };
                            readonly datasetImageCount: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The number of images in the training dataset when sd_version is set to 'FLUX_DEV'. Must be between 1 and 50.";
                            };
                        };
                    };
                    readonly TEXTURE_GENERATION: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for TEXTURE_GENERATION service";
                        readonly properties: {
                            readonly preview: {
                                readonly title: "Boolean";
                                readonly type: "boolean";
                            };
                        };
                    };
                    readonly UNIVERSAL_UPSCALER: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for UNIVERSAL_UPSCALER service";
                        readonly properties: {
                            readonly megapixel: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The maximum upscaled image size is 20 megapixels.";
                            };
                        };
                    };
                    readonly UNIVERSAL_UPSCALER_ULTRA: {
                        readonly title: "Object";
                        readonly type: "object";
                        readonly description: "Parameters for UNIVERSAL_UPSCALER_ULTRA service";
                        readonly properties: {
                            readonly inputWidth: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input width of the image.";
                            };
                            readonly inputHeight: {
                                readonly title: "Int";
                                readonly type: "integer";
                                readonly description: "The input height of the image.";
                            };
                            readonly upscaleMultiplier: {
                                readonly title: "Float";
                                readonly type: "number";
                                readonly description: "The upscale multiplier of the universal upscaler. Must be between 1.00 and 2.00.";
                            };
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly calculateProductionApiServiceCost: {
                    readonly properties: {
                        readonly cost: {
                            readonly title: "Int";
                            readonly type: "integer";
                            readonly description: "API service cost to generate the image.";
                        };
                    };
                    readonly title: "calculateProductionApiServiceCost";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PromptImprove: {
    readonly body: {
        readonly properties: {
            readonly prompt: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt to improve.";
            };
            readonly promptInstructions: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The prompt is improved based on the given instructions.";
            };
            readonly isVideo: {
                readonly type: "boolean";
                readonly description: "Specifies whether the prompt is for a video generation. Defaults to false (image prompt).";
                readonly examples: readonly [true];
            };
        };
        readonly required: readonly ["prompt"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly promptGeneration: {
                    readonly properties: {
                        readonly prompt: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "The improved prompt.";
                            readonly default: "The improved prompt.";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Random Prompt Generation. Available for Production API Users.";
                            readonly default: 4;
                        };
                    };
                    readonly title: "promptGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PromptRandom: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly promptGeneration: {
                    readonly properties: {
                        readonly prompt: {
                            readonly title: "String";
                            readonly type: "string";
                            readonly description: "The random prompt generated.";
                            readonly default: "The random prompt generated.";
                        };
                        readonly apiCreditCost: {
                            readonly type: "integer";
                            readonly description: "API Credits Cost for Random Prompt Generation. Available for Production API Users.";
                            readonly default: 4;
                        };
                    };
                    readonly title: "promptGenerationOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadCanvasInitImage: {
    readonly body: {
        readonly properties: {
            readonly initExtension: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Has to be png, jpg, jpeg, or webp.";
            };
            readonly maskExtension: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Has to be png, jpg, jpeg, or webp.";
            };
        };
        readonly required: readonly ["initExtension", "maskExtension"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly uploadCanvasInitImage: {
                    readonly properties: {
                        readonly initImageId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly initFields: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly initKey: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly initUrl: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly maskImageId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly maskFields: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly maskKey: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly maskUrl: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "CanvasInitImageUploadOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadDatasetImage: {
    readonly body: {
        readonly properties: {
            readonly extension: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Has to be png, jpg, jpeg, or webp.";
            };
        };
        readonly required: readonly ["extension"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly datasetId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "_\"datasetId\" is required";
                };
            };
            readonly required: readonly ["datasetId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly uploadDatasetImage: {
                    readonly properties: {
                        readonly fields: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly key: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "DatasetUploadOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadDatasetImageFromGen: {
    readonly body: {
        readonly properties: {
            readonly generatedImageId: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "The ID of the image to upload to the dataset.";
            };
        };
        readonly required: readonly ["generatedImageId"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly datasetId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The ID of the dataset to upload the image to.";
                };
            };
            readonly required: readonly ["datasetId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly uploadDatasetImageFromGen: {
                    readonly properties: {
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "DatasetGenUploadOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadInitImage: {
    readonly body: {
        readonly properties: {
            readonly extension: {
                readonly title: "String";
                readonly type: "string";
                readonly description: "Has to be png, jpg, jpeg, or webp.";
            };
        };
        readonly required: readonly ["extension"];
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly uploadInitImage: {
                    readonly properties: {
                        readonly fields: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly key: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "InitImageUploadOutput";
                    readonly type: "object";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadModelAsset: {
    readonly body: {
        readonly properties: {
            readonly modelExtension: {
                readonly title: "String";
                readonly type: "string";
            };
            readonly name: {
                readonly title: "String";
                readonly type: "string";
            };
        };
        readonly type: "object";
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly properties: {
                readonly uploadModelAsset: {
                    readonly properties: {
                        readonly modelFields: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly modelId: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly modelKey: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                        readonly modelUrl: {
                            readonly title: "String";
                            readonly type: "string";
                        };
                    };
                    readonly title: "ModelAssetUploadOutput";
                    readonly type: "object";
                };
            };
            readonly type: "object";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { CreateDataset, CreateElement, CreateGeneration, CreateImageToVideoGeneration, CreateLcmGeneration, CreateModel, CreateSvdMotionGeneration, CreateTextToVideoGeneration, CreateTextureGeneration, CreateUniversalUpscalerJob, CreateVariationNoBg, CreateVariationUnzoom, CreateVariationUpscale, CreateVideoUpscale, Delete3DModelById, DeleteDatasetById, DeleteElementById, DeleteGenerationById, DeleteInitImageById, DeleteModelById, DeleteTextureGenerationById, Get3DModelById, Get3DModelsByUserId, GetCustomElementsByUserId, GetCustomModelsByUserId, GetDatasetById, GetElementById, GetGenerationById, GetGenerationsByUserId, GetInitImageById, GetModelById, GetMotionVariationById, GetTextureGenerationById, GetTextureGenerationsByModelId, GetUserSelf, GetVariationById, ListElements, ListPlatformModels, PerformAlchemyUpscaleLcm, PerformInpaintingLcm, PerformInstantRefine, PricingCalculator, PromptImprove, PromptRandom, UploadCanvasInitImage, UploadDatasetImage, UploadDatasetImageFromGen, UploadInitImage, UploadModelAsset };
