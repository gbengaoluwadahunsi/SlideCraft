# Training a Custom ML Model for Infographic Generation

A comprehensive guide to fine-tuning foundation models for infographic-specific output.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Approaches](#architecture-approaches)
3. [Dataset Creation](#dataset-creation)
4. [Training Pipeline](#training-pipeline)
5. [Model Selection](#model-selection)
6. [Implementation Examples](#implementation-examples)
7. [Evaluation Metrics](#evaluation-metrics)
8. [Resources & Datasets](#resources--datasets)

---

## Overview

### The Problem

No dedicated ML model exists specifically for infographic generation. Current commercial solutions use:

- General-purpose LLMs (GPT-4, Claude, Llama) for content structuring
- Text-to-image models (DALL-E, Stable Diffusion, Ideogram) for visuals
- Template engines for deterministic layout

### The Opportunity

Fine-tune a specialized model that understands:

- Information hierarchy and visual storytelling
- Chart/graph selection based on data type
- Color theory and design principles
- Layout composition and whitespace
- Typography pairing and sizing

---

## Architecture Approaches

### Approach 1: Fine-tuned LLM for Structured Output (Recommended)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Raw Text   │ ──▶ │  Fine-tuned LLM  │ ──▶ │  JSON Structure │
│  or Data    │     │  (Llama/Mistral) │     │  (Layout Spec)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────┐
                                            │  Deterministic  │
                                            │  Renderer       │
                                            │  (React/SVG)    │
                                            └─────────────────┘
```

**Pros:**
- Most practical and achievable
- Predictable, editable output
- Lower compute requirements
- Easy to iterate and debug

**Cons:**
- Limited to predefined visual components
- Requires good renderer implementation

---

### Approach 2: Vision-Language Model (VLM) Fine-tuning

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Text +     │ ──▶ │  Fine-tuned VLM  │ ──▶ │  Layout Coords  │
│  Examples   │     │  (LLaVA/Qwen-VL) │     │  + Styling      │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

**Pros:**
- Can learn from visual examples
- Better understanding of design aesthetics

**Cons:**
- Higher compute requirements
- More complex training pipeline

---

### Approach 3: Diffusion Model Fine-tuning

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Text       │ ──▶ │  Fine-tuned      │ ──▶ │  Raster Image   │
│  Prompt     │     │  SD/FLUX LoRA    │     │  (PNG/JPG)      │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

**Pros:**
- True end-to-end image generation
- Can create novel visual styles

**Cons:**
- Text rendering is unreliable
- Output not editable
- Requires large dataset (5,000-10,000+ images)
- High compute cost

---

### Approach 4: Hybrid Multi-Model Pipeline (Production-Grade)

```
┌──────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
└──────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────────┐    ┌─────────────┐
   │  Content    │     │  Layout         │    │  Style      │
   │  Agent      │     │  Agent          │    │  Agent      │
   │  (LLM)      │     │  (Fine-tuned)   │    │  (LLM)      │
   └─────────────┘     └─────────────────┘    └─────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 ▼
                    ┌─────────────────────┐
                    │  Composition Engine │
                    │  + Renderer         │
                    └─────────────────────┘
```

---

## Dataset Creation

### Schema Definition

Define a JSON schema for infographic structures:

```json
{
  "$schema": "infographic-v1",
  "metadata": {
    "title": "string",
    "topic": "string",
    "style": "minimal | corporate | creative | data-heavy",
    "colorScheme": "string",
    "targetAudience": "string"
  },
  "slides": [
    {
      "id": "string",
      "type": "cover | content | chart | visual | comparison | timeline | cta",
      "layout": "centered | split | grid | freeform",
      "elements": [
        {
          "type": "heading | subheading | body | bullet-list | chart | icon | image | shape",
          "content": "string | object",
          "position": { "x": "number", "y": "number" },
          "size": { "width": "number", "height": "number" },
          "style": {
            "fontSize": "number",
            "fontWeight": "string",
            "color": "string",
            "alignment": "left | center | right"
          }
        }
      ]
    }
  ],
  "charts": [
    {
      "id": "string",
      "chartType": "bar | line | pie | donut | area | scatter | treemap | funnel",
      "data": [{ "label": "string", "value": "number" }],
      "config": {
        "showLegend": "boolean",
        "showLabels": "boolean",
        "colorPalette": ["string"]
      }
    }
  ]
}
```

### Data Collection Methods

#### Method 1: Manual Annotation

1. Collect 1,000-5,000 high-quality infographics (Pinterest, Dribbble, Behance)
2. Manually annotate each with the JSON schema
3. Time estimate: ~15-30 min per infographic

#### Method 2: Synthetic Generation

```python
# Generate synthetic training pairs
import json
import random

TOPICS = ["technology", "health", "finance", "education", "marketing"]
STYLES = ["minimal", "corporate", "creative", "data-heavy"]
CHART_TYPES = ["bar", "line", "pie", "donut"]
LAYOUTS = ["centered", "split", "grid"]

def generate_synthetic_example():
    topic = random.choice(TOPICS)
    num_slides = random.randint(4, 10)
    
    infographic = {
        "metadata": {
            "title": f"Sample {topic.title()} Infographic",
            "topic": topic,
            "style": random.choice(STYLES),
        },
        "slides": []
    }
    
    # Cover slide
    infographic["slides"].append({
        "type": "cover",
        "layout": "centered",
        "elements": [
            {"type": "heading", "content": f"Understanding {topic.title()}"},
            {"type": "subheading", "content": "Key insights and trends"}
        ]
    })
    
    # Content slides
    for i in range(num_slides - 1):
        slide_type = random.choice(["content", "chart", "visual"])
        infographic["slides"].append(generate_slide(slide_type))
    
    return infographic
```

#### Method 3: LLM-Assisted Annotation

Use GPT-4 or Claude to generate initial annotations, then human-verify:

```python
ANNOTATION_PROMPT = """
Analyze this infographic image and output a JSON structure describing:
1. The overall layout and style
2. Each visual element (headings, text blocks, charts, icons)
3. The hierarchy and flow of information
4. Color scheme and typography choices

Output format: {schema}
"""
```

### Recommended Dataset Size

| Approach | Minimum | Recommended | Optimal |
|----------|---------|-------------|---------|
| LoRA Fine-tuning | 500 | 2,000 | 5,000+ |
| Full Fine-tuning | 5,000 | 20,000 | 100,000+ |
| Diffusion LoRA | 1,000 | 5,000 | 10,000+ |

---

## Training Pipeline

### Prerequisites

```bash
# Create virtual environment
python -m venv infographic-ml
source infographic-ml/bin/activate  # Linux/Mac
# or: infographic-ml\Scripts\activate  # Windows

# Install dependencies
pip install torch transformers datasets peft accelerate bitsandbytes
pip install wandb  # for experiment tracking
```

### LoRA Fine-tuning Script (Llama 3.1)

```python
# train_infographic_llm.py

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Configuration
MODEL_NAME = "meta-llama/Llama-3.1-8B-Instruct"
OUTPUT_DIR = "./infographic-llm-lora"
DATASET_PATH = "./data/infographic_dataset.jsonl"

# Quantization config for efficient training
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# Prepare for LoRA training
model = prepare_model_for_kbit_training(model)

# LoRA configuration
lora_config = LoraConfig(
    r=16,                          # LoRA rank
    lora_alpha=32,                 # LoRA alpha
    target_modules=[               # Modules to apply LoRA
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)

# Load and preprocess dataset
def format_example(example):
    """Format training example as instruction-response pair."""
    system_prompt = """You are an expert infographic designer. Given content or a topic, 
    output a detailed JSON structure describing an infographic layout with slides, 
    elements, charts, and styling. Follow the infographic-v1 schema exactly."""
    
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>
Create an infographic about: {example['input']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
{example['output']}<|eot_id|>"""
    
    return {"text": prompt}

dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
dataset = dataset.map(format_example)

# Tokenize
def tokenize(example):
    return tokenizer(
        example["text"],
        truncation=True,
        max_length=4096,
        padding="max_length",
    )

tokenized_dataset = dataset.map(tokenize, remove_columns=dataset.column_names)

# Training arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    weight_decay=0.01,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    logging_steps=10,
    save_steps=100,
    save_total_limit=3,
    bf16=True,
    gradient_checkpointing=True,
    report_to="wandb",
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer,
)

trainer.train()

# Save the LoRA adapter
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
```

### Training Data Format (JSONL)

```jsonl
{"input": "Create an infographic about the benefits of remote work for a corporate audience", "output": "{\"metadata\":{\"title\":\"The Remote Work Revolution\",\"style\":\"corporate\"},\"slides\":[{\"type\":\"cover\",\"elements\":[{\"type\":\"heading\",\"content\":\"The Remote Work Revolution\"},{\"type\":\"subheading\",\"content\":\"5 Key Benefits for Modern Organizations\"}]},{\"type\":\"chart\",\"chartType\":\"bar\",\"data\":[{\"label\":\"Productivity\",\"value\":77},{\"label\":\"Satisfaction\",\"value\":82}]}]}"}
{"input": "Design a timeline infographic showing the history of artificial intelligence", "output": "{\"metadata\":{\"title\":\"AI Through the Ages\",\"style\":\"creative\"},\"slides\":[{\"type\":\"cover\"},{\"type\":\"timeline\",\"elements\":[{\"year\":1950,\"event\":\"Turing Test\"},{\"year\":1956,\"event\":\"Dartmouth Conference\"}]}]}"}
```

---

## Model Selection

### Recommended Base Models

| Model | Parameters | VRAM Required | Best For |
|-------|------------|---------------|----------|
| **Llama 3.1 8B** | 8B | 16GB (4-bit) | Best balance of quality/cost |
| **Mistral 7B** | 7B | 14GB (4-bit) | Fast inference |
| **Qwen2.5 7B** | 7B | 14GB (4-bit) | Strong JSON output |
| **Llama 3.1 70B** | 70B | 40GB+ (4-bit) | Highest quality |
| **Phi-3 Mini** | 3.8B | 8GB (4-bit) | Edge deployment |

### For Vision-Language (VLM) Approach

| Model | Parameters | Best For |
|-------|------------|----------|
| **LLaVA 1.6** | 7B/13B | Learning from visual examples |
| **Qwen-VL** | 7B | Strong visual understanding |
| **InternVL2** | 8B/26B | High accuracy |

---

## Implementation Examples

### Inference Script

```python
# inference.py

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import json

# Load base model and LoRA adapter
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct",
    device_map="auto",
    torch_dtype=torch.bfloat16,
)
model = PeftModel.from_pretrained(base_model, "./infographic-llm-lora")
tokenizer = AutoTokenizer.from_pretrained("./infographic-llm-lora")

def generate_infographic(topic: str, style: str = "corporate", num_slides: int = 6):
    """Generate infographic structure from topic."""
    
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert infographic designer. Output valid JSON only.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
Create a {style} infographic with {num_slides} slides about: {topic}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>"""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=2048,
        temperature=0.7,
        do_sample=True,
        top_p=0.9,
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract JSON from response
    json_start = response.find("{")
    json_end = response.rfind("}") + 1
    json_str = response[json_start:json_end]
    
    return json.loads(json_str)

# Example usage
infographic = generate_infographic(
    topic="The Future of Electric Vehicles",
    style="minimal",
    num_slides=8
)
print(json.dumps(infographic, indent=2))
```

### Integration with Your Carouslk Project

```typescript
// lib/infographic-model.ts

import Anthropic from '@anthropic-ai/sdk';  // or your fine-tuned model API

interface InfographicRequest {
  topic: string;
  style: 'minimal' | 'corporate' | 'creative' | 'data-heavy';
  slideCount: number;
  targetAudience?: string;
}

export async function generateWithCustomModel(request: InfographicRequest) {
  // Option 1: Self-hosted model via vLLM/TGI
  const response = await fetch('http://your-model-server:8000/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: buildPrompt(request),
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  
  const result = await response.json();
  return parseInfographicJSON(result.generated_text);
}

// Option 2: Use fine-tuned model on Replicate/Together/Modal
export async function generateWithReplicateModel(request: InfographicRequest) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'your-fine-tuned-model-version',
      input: { prompt: buildPrompt(request) },
    }),
  });
  
  return response.json();
}
```

---

## Evaluation Metrics

### Automated Metrics

```python
# evaluate.py

from typing import Dict, List
import json

def evaluate_infographic(generated: Dict, reference: Dict) -> Dict[str, float]:
    """Evaluate generated infographic against reference."""
    
    scores = {}
    
    # 1. Schema Validity
    scores['schema_valid'] = validate_schema(generated)
    
    # 2. Slide Count Accuracy
    target_slides = len(reference.get('slides', []))
    actual_slides = len(generated.get('slides', []))
    scores['slide_count_accuracy'] = 1 - abs(target_slides - actual_slides) / target_slides
    
    # 3. Element Diversity
    element_types = set()
    for slide in generated.get('slides', []):
        for elem in slide.get('elements', []):
            element_types.add(elem.get('type'))
    scores['element_diversity'] = len(element_types) / 10  # Normalize by max types
    
    # 4. Chart Appropriateness (if data provided)
    scores['chart_selection'] = evaluate_chart_selection(generated)
    
    # 5. JSON Parse Success Rate
    scores['json_valid'] = 1.0 if generated else 0.0
    
    return scores

def validate_schema(infographic: Dict) -> float:
    """Check if infographic follows expected schema."""
    required_fields = ['metadata', 'slides']
    slide_required = ['type', 'elements']
    
    score = 0
    total_checks = 0
    
    for field in required_fields:
        total_checks += 1
        if field in infographic:
            score += 1
    
    for slide in infographic.get('slides', []):
        for field in slide_required:
            total_checks += 1
            if field in slide:
                score += 1
    
    return score / total_checks if total_checks > 0 else 0
```

### Human Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Visual Hierarchy | 20% | Clear information flow |
| Content Relevance | 25% | Matches input topic |
| Design Aesthetics | 20% | Professional appearance |
| Chart Appropriateness | 15% | Right chart for data type |
| Readability | 20% | Text legibility and spacing |

---

## Resources & Datasets

### Available Datasets

1. **ChartGalaxy** (arxiv.org/abs/2505.18668)
   - 1M+ infographic charts
   - 75 chart types, 68 layout templates
   - Best for chart-focused training

2. **Infographic-VQA**
   - Visual question answering on infographics
   - Good for understanding infographic structure

3. **PubLayNet**
   - Document layout dataset
   - Adaptable for infographic layouts

4. **RICO** (UI Dataset)
   - Mobile UI layouts
   - Similar principles apply

### Tools & Frameworks

- **Unsloth** - 2x faster LoRA training
- **Axolotl** - Easy fine-tuning configs
- **LLaMA-Factory** - All-in-one training framework
- **vLLM** - Fast inference server
- **Text Generation Inference (TGI)** - Production serving

### Cloud Training Options

| Provider | GPU | Cost/hr | Notes |
|----------|-----|---------|-------|
| Lambda Labs | A100 80GB | ~$1.50 | Best value |
| RunPod | A100 80GB | ~$1.99 | Easy setup |
| Vast.ai | A100 40GB | ~$0.80 | Variable availability |
| Google Colab Pro+ | A100 40GB | ~$50/mo | For prototyping |
| Modal | A100 | Pay-per-use | Serverless |

---

## Next Steps

1. **Start Small**: Create 100 manual annotations to validate your schema
2. **Synthetic Expansion**: Use GPT-4 to generate 1,000+ synthetic examples
3. **Train LoRA**: Fine-tune Llama 3.1 8B with your dataset
4. **Evaluate**: Test on held-out examples
5. **Iterate**: Refine schema and training data based on results
6. **Deploy**: Host on Replicate, Modal, or self-hosted vLLM

---

## License & Attribution

This guide is provided for educational purposes. When using pre-trained models, ensure compliance with their respective licenses:

- Llama 3.1: Meta License
- Mistral: Apache 2.0
- Qwen: Tongyi Qianwen License

---

*Last updated: December 2024*

